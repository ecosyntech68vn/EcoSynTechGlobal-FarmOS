module.exports = {
  id: 'emotional-ai-companion',
  name: 'Emotional AI Companion',
  category: 'communication',
  triggers: ['schedule:30m', 'event:user-interaction'],
  riskLevel: 'low',
  canAutoFix: true,
  description: 'Hiểu cảm xúc nông dân và hỗ trợ tâm lý, tăng engagement',
  emotionalFramework: {
    emotions: ['happy', 'frustrated', 'worried', 'excited', 'neutral'],
    responseTime: 500,
    empathyLevel: 0.9
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const emotionalStatus = {
      usersAnalyzed: 0,
      emotions: {},
      interventions: [],
      satisfactionScore: 0,
      recommendations: []
    };
    
    try {
      logger.info('[EmotionalAI] Analyzing user emotions...');
      
      const recentInteractions = await db.query(
        `SELECT user_id, message, sentiment_score, timestamp
         FROM user_interactions
         WHERE timestamp > datetime("now", "-24 hours")
         ORDER BY timestamp DESC
         LIMIT 100`
      );
      
      const userEmotions = {};
      
      for (const interaction of recentInteractions) {
        const emotion = detectEmotion(interaction.message, interaction.sentiment_score);
        
        if (!userEmotions[interaction.user_id]) {
          userEmotions[interaction.user_id] = { emotions: [], count: 0 };
        }
        
        userEmotions[interaction.user_id].emotions.push(emotion);
        userEmotions[interaction.user_id].count++;
        emotionalStatus.usersAnalyzed++;
      }
      
      for (const [userId, data] of Object.entries(userEmotions)) {
        const dominantEmotion = getDominantEmotion(data.emotions);
        
        if (!emotionalStatus.emotions[dominantEmotion]) {
          emotionalStatus.emotions[dominantEmotion] = 0;
        }
        emotionalStatus.emotions[dominantEmotion]++;
        
        if (dominantEmotion === 'frustrated' || dominantEmotion === 'worried') {
          const intervention = await createIntervention(userId, dominantEmotion, db, logger);
          emotionalStatus.interventions.push(intervention);
        }
      }
      
      emotionalStatus.satisfactionScore = calculateSatisfaction(emotionalStatus.emotions);
      
      if (emotionalStatus.satisfactionScore < 70) {
        emotionalStatus.recommendations.push({
          priority: 'high',
          action: 'Review user frustration patterns',
          reason: 'Satisfaction below threshold'
        });
      }
      
      return {
        ok: emotionalStatus.satisfactionScore > 60,
        emotionalStatus: emotionalStatus,
        usersAnalyzed: emotionalStatus.usersAnalyzed,
        satisfactionScore: emotionalStatus.satisfactionScore,
        recommendations: emotionalStatus.recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[EmotionalAI] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function detectEmotion(message, sentiment) {
      if (!message) return 'neutral';
      
      const messageLower = message.toLowerCase();
      
      if (messageLower.includes('tuyệt') || messageLower.includes('vui') || messageLower.includes('happy')) {
        return 'happy';
      }
      if (messageLower.includes('thất vọng') || messageLower.includes('frustrated') || messageLower.includes('chán')) {
        return 'frustrated';
      }
      if (messageLower.includes('lo lắng') || messageLower.includes('worried') || messageLower.includes('sợ')) {
        return 'worried';
      }
      if (messageLower.includes('hào hứng') || messageLower.includes('excited') || messageLower.includes('mong đợi')) {
        return 'excited';
      }
      
      if (sentiment > 0.6) return 'happy';
      if (sentiment < 0.4) return 'frustrated';
      
      return 'neutral';
    }
    
    function getDominantEmotion(emotions) {
      const counts = {};
      for (const emotion of emotions) {
        counts[emotion] = (counts[emotion] || 0) + 1;
      }
      
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    async function createIntervention(userId, emotion, db, logger) {
      const responses = {
        frustrated: 'Tôi hiểu bạn đang gặp khó khăn. Hãy để tôi giúp bạn giải quyết vấn đề này nhé! 🌱',
        worried: 'Đừng lo lắng quá! Hệ thống đang theo dõi và sẽ cảnh báo sớm nếu có vấn đề. Bạn có muốn tôi giải thích thêm không?',
        worried_alt: 'Mọi thứ sẽ ổn thôi! 🌟 Hãy cho tôi biết bạn đang lo lắng điều gì nhé.'
      };
      
      const response = responses[emotion] || responses.worried_alt;
      
      try {
        await db.query(
          'INSERT INTO emotional_interventions (user_id, emotion, response, created_at) VALUES (?, ?, ?, datetime("now"))',
          [userId, emotion, response]
        );
      } catch {}
      
      return { userId, emotion, response };
    }
    
    function calculateSatisfaction(emotions) {
      const total = Object.values(emotions).reduce((a, b) => a + b, 0);
      if (total === 0) return 75;
      
      const positive = (emotions.happy || 0) + (emotions.excited || 0);
      const negative = (emotions.frustrated || 0) + (emotions.worried || 0);
      
      return Math.round(((positive - negative / 2) / total) * 100 + 50);
    }
  }
};