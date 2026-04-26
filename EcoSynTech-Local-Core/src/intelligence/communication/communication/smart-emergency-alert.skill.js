module.exports = {
  id: 'smart-emergency-alert',
  name: 'Smart Emergency Alert System',
  category: 'communication',
  triggers: ['event:critical', 'schedule:2m'],
  riskLevel: 'critical',
  canAutoFix: false,
  description: 'Sends 3 emergency alerts 2 minutes apart with escalating information',
  alertProtocol: {
    attempts: 3,
    intervalMinutes: 2,
    channels: ['telegram', 'sms', 'email'],
    escalationMessage: '⚠️ CRITICAL ALERT - Immediate action required!'
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const alertStatus = {
      sent: 0,
      pendingAlerts: [],
      acknowledged: []
    };
    
    try {
      logger.info('[SmartAlert] Processing emergency alert...');
      
      const activeEmergencies = await db.query(
        `SELECT id, type, data, createdAt, 
                alert1Sent, alert2Sent, alert3Sent, acknowledged
         FROM emergency_alerts
         WHERE status = 'active'
         AND createdAt > datetime("now", "-30 minutes")
         ORDER BY createdAt ASC`
      );
      
      for (const emergency of activeEmergencies) {
        const data = typeof emergency.data === 'string' 
          ? JSON.parse(emergency.data) 
          : emergency.data;
        
        const now = new Date();
        const created = new Date(emergency.createdAt);
        const minutesSinceCreation = (now - created) / 1000 / 60;
        
        let alertNumber = 0;
        if (minutesSinceCreation < this.alertProtocol.intervalMinutes) {
          alertNumber = 1;
        } else if (minutesSinceCreation < this.alertProtocol.intervalMinutes * 2) {
          alertNumber = 2;
        } else {
          alertNumber = 3;
        }
        
        const shouldSend = alertNumber === 1 && !emergency.alert1Sent ||
                        alertNumber === 2 && !emergency.alert2Sent && emergency.alert1Sent ||
                        alertNumber === 3 && !emergency.alert3Sent && emergency.alert2Sent;
        
        if (shouldSend && alertNumber <= 3) {
          const message = buildAlertMessage(alertNumber, emergency, data);
          const sent = await sendAlert(message, this.alertProtocol.channels, db);
          
          if (sent) {
            const updateField = 'alert' + alertNumber + 'Sent';
            await db.query(
              `UPDATE emergency_alerts SET ${updateField} = 1, lastAlertAt = datetime("now") WHERE id = ?`,
              [emergency.id]
            );
            
            alertStatus.sent++;
            alertStatus.pendingAlerts.push({
              id: emergency.id,
              type: emergency.type,
              alertNumber: alertNumber,
              message: message.substring(0, 50)
            });
            
            logger.warn('[SmartAlert] Sent alert #' + alertNumber + ' for: ' + emergency.type);
          }
        }
        
        if (emergency.acknowledged) {
          alertStatus.acknowledged.push({
            id: emergency.id,
            acknowledgedAt: emergency.acknowledged
          });
        }
      }
      
      if (event.type === 'critical') {
        const newAlert = await db.query(
          `INSERT INTO emergency_alerts (type, data, status, createdAt) 
           VALUES (?, ?, 'active', datetime("now")) RETURNING id`,
          [event.type, JSON.stringify(event.data || {})]
        );
        
        logger.error('[SmartAlert] NEW CRITICAL ALERT: ' + event.type);
      }
      
      return {
        ok: true,
        alertStatus: alertStatus,
        pendingCount: alertStatus.pendingAlerts.length,
        recommendations: alertStatus.sent > 0
          ? alertStatus.sent + ' alerts sent - awaiting acknowledgment'
          : 'No new alerts to send',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[SmartAlert] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function buildAlertNumber(alertNumber, emergency, data) {
      const prefix = alertNumber === 1 ? '🆘 CRITICAL: ' : 
        alertNumber === 2 ? '🆘 URGENT: ' : 
          '🆘 FINAL: ';
      
      return prefix + emergency.type + '\n\n' +
             'Alert #' + alertNumber + ' of 3\n' +
             'Time: ' + new Date().toISOString() + '\n' +
             'Details: ' + JSON.stringify(data).substring(0, 100) + '\n\n' +
             (alertNumber < 3 ? 'Next alert in ' + (3 - alertNumber) * 2 + ' minutes\n' : '') +
             'Reply ACKNOWLEDGE to confirm';
    }
    
    async function sendAlert(message, channels, db) {
      try {
        await db.query(
          'INSERT INTO notification_queue (channel, message, status, createdAt) VALUES (?, ?, ?, datetime("now"))',
          [channels.join(','), message, 'pending']
        );
        return true;
      } catch (err) {
        logger.error('[SmartAlert] Send error:', err.message);
        return false;
      }
    }
  }
};