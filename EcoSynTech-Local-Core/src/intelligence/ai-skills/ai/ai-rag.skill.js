module.exports = {
  id: 'ai-rag',
  name: 'AI RAG Knowledge Base',
  description: 'Retrieval Augmented Generation - Load docs, answer from knowledge',
  triggers: [
    'event:ai.rag',
    'event:ai.query',
    'event:ai.search',
    'cron:30m'
  ],
  riskLevel: 'low',
  canAutoFix: false,
  
  docCache: null,
  lastLoad: 0,
  
  run: function(ctx) {
    const event = ctx.event || {};
    const action = event.action || 'query';
    const query = event.query || event.question || '';
    const stateStore = ctx.stateStore;
    
    const result = {
      ok: true,
      action: action,
      timestamp: new Date().toISOString(),
      answer: null,
      sources: [],
      context: [],
      confidence: 0
    };
    
    switch (action) {
    case 'load':
      result.docs = this.loadAllDocs();
      result.answer = 'Loaded ' + Object.keys(result.docs).length + ' documents';
      break;
        
    case 'query':
    case 'search':
      var context = this.getRelevantContext(query, stateStore);
      result.context = context;
      result.sources = context.map(function(c) { return c.source; });
      result.answer = this.generateAnswer(query, context);
      result.confidence = context.length > 0 ? 0.95 : 0.5;
      break;
        
    case 'reload':
      this.docCache = null;
      result.docs = this.loadAllDocs();
      result.answer = 'Reloaded all documents';
      break;
        
    default:
      result.answer = 'Use action: load, query, search, or reload';
    }
    
    return result;
  },
  
  loadAllDocs: function() {
    const docs = {};
    const now = Date.now();
    
    if (this.docCache && (now - this.lastLoad) < 1800000) {
      return this.docCache;
    }
    
    try {
      docs.readme = this.loadFile('README.md');
      docs.operations = this.loadFile('OPERATIONS.md');
      docs.marketing = this.loadFile('MARKETING.md');
      docs.api = this.loadFile('API_REFERENCE.md');
      docs.skills = this.loadFile('SKILLS_REFERENCE.md');
      docs.i18n = this.loadFile('I18N_GUIDE.md');
    } catch (e) {
      docs.error = e.message;
    }
    
    this.docCache = docs;
    this.lastLoad = now;
    
    return docs;
  },
  
  loadFile: function(filename) {
    const fs = require('fs');
    const path = require('path');
    const baseDir = process.cwd();
    const filePath = path.join(baseDir, filename);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.chunkText(content, 500);
    }
    return [];
  },
  
  chunkText: function(text, chunkSize) {
    const chunks = [];
    const paragraphs = text.split(/\n\n+/);
    let current = '';
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (!para) continue;
      
      if (current.length + para.length > chunkSize) {
        if (current) chunks.push(current);
        current = para;
      } else {
        current += '\n\n' + para;
      }
    }
    
    if (current) chunks.push(current);
    
    return chunks.map(function(chunk, idx) {
      return {
        id: 'chunk_' + idx,
        text: chunk,
        keywords: chunk.toLowerCase().split(/\s+/).filter(function(w) {
          return w.length > 4;
        })
      };
    });
  },
  
  getRelevantContext: function(query, stateStore) {
    const docs = this.loadAllDocs();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(function(w) {
      return w.length > 2;
    });
    
    const context = [];
    const scores = [];
    
    for (const docName in docs) {
      const chunks = docs[docName];
      if (!chunks || !Array.isArray(chunks)) continue;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.text) continue;
        
        const textLower = chunk.text.toLowerCase();
        let score = 0;
        
        for (let j = 0; j < queryWords.length; j++) {
          if (textLower.indexOf(queryWords[j]) !== -1) {
            score += 1;
          }
        }
        
        if (score > 0) {
          scores.push({
            chunk: chunk,
            source: docName,
            score: score
          });
        }
      }
    }
    
    scores.sort(function(a, b) {
      return b.score - a.score;
    });
    
    const topResults = scores.slice(0, 5);
    
    for (let k = 0; k < topResults.length; k++) {
      context.push({
        text: topResults[k].chunk.text,
        source: topResults[k].source,
        relevance: topResults[k].score
      });
    }
    
    if (stateStore) {
      let history = stateStore.get('rag_history') || [];
      history.unshift({
        query: query,
        context: context.map(function(c) { return c.source; }),
        timestamp: Date.now()
      });
      if (history.length > 20) history = history.slice(0, 20);
      stateStore.set('rag_history', history);
    }
    
    return context;
  },
  
  generateAnswer: function(query, context) {
    if (!context || context.length === 0) {
      return 'Không tìm thấy thông tin phù hợp. Bạn hỏi cụ thể hơn được không?';
    }
    
    let answer = '';
    const foundInfo = [];
    
    for (let i = 0; i < Math.min(3, context.length); i++) {
      const c = context[i];
      let text = c.text;
      if (text.length > 400) {
        text = text.substring(0, 397) + '...';
      }
      foundInfo.push(text);
    }
    
    answer = 'Tìm thấy trong ' + context[0].source + ':\n\n';
    answer += foundInfo.join('\n\n');
    
    return answer;
  },
  
  getStats: function() {
    const docs = this.loadAllDocs();
    const stats = {};
    
    for (const name in docs) {
      const chunks = docs[name];
      stats[name] = chunks ? chunks.length : 0;
    }
    
    return {
      docs: stats,
      lastLoad: this.lastLoad,
      cacheAge: Date.now() - this.lastLoad
    };
  },
  
  clearCache: function() {
    this.docCache = null;
    this.lastLoad = 0;
    return 'Cache cleared';
  }
};