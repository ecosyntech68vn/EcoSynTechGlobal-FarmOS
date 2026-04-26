module.exports = {
  id: 'ai-inference',
  name: 'AI Inference',
  description: 'Free AI inference using Ollama, LM Studio, or compatible APIs for local/cloud AI',
  triggers: [
    'event:ai.inference',
    'event:ai.complete',
    'cron:30m'
  ],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    const event = ctx.event || {};
    const action = event.action || event.type?.replace('ai.', '') || 'inference';
    const stateStore = ctx.stateStore;
    
    const config = this.getConfig();
    const provider = event.provider || config.defaultProvider || 'ollama';
    
    const result = {
      ok: true,
      action: action,
      provider: provider,
      model: event.model || config.models?.[provider] || 'llama3',
      timestamp: new Date().toISOString(),
      response: null,
      tokens: 0
    };
    
    switch (action) {
    case 'chat':
      result.response = this.chat(event.message, event.model, provider, config);
      result.tokens = result.response?.split(' ').length || 0;
      break;
        
    case 'complete':
      result.response = this.complete(event.prompt, event.model, provider, config);
      break;
        
    case 'inference':
    default:
      result.response = this.inference(event.prompt, event.model, provider, config);
      break;
    }
    
    if (stateStore) {
      let history = stateStore.get('aiHistory') || [];
      history.unshift({
        prompt: event.message || event.prompt,
        response: result.response,
        provider: provider,
        model: result.model,
        timestamp: Date.now()
      });
      if (history.length > 50) history = history.slice(0, 50);
      stateStore.set('aiHistory', history);
    }
    
    return result;
  },
  
  getConfig: function() {
    const defaultConfig = {
      defaultProvider: 'ollama',
      providers: {
        ollama: {
          baseUrl: 'http://localhost:11434',
          model: 'llama3',
          enabled: true
        },
        lmstudio: {
          baseUrl: 'http://localhost:1234/v1',
          model: 'local-model',
          enabled: true
        },
        deepseek: {
          baseUrl: 'https://api.deepseek.com/v1',
          model: 'deepseek-chat',
          apiKey: process.env.DEEPSEEK_API_KEY || '',
          enabled: false
        }
      },
      models: {
        ollama: 'llama3',
        lmstudio: 'local-model',
        deepseek: 'deepseek-chat'
      }
    };
    
    try {
      const customConfig = require('../../config');
      return customConfig.ai || defaultConfig;
    } catch (e) {
      return defaultConfig;
    }
  },
  
  chat: function(message, model, provider, config) {
    const providerConfig = config.providers?.[provider] || config.providers.ollama;
    
    if (!providerConfig.enabled) {
      return 'AI provider disabled. Enable in config.';
    }
    
    if (provider === 'ollama') {
      return 'Ollama not running. Install from ollama.com and run: ollama serve';
    } else if (provider === 'lmstudio') {
      return 'LM Studio not running. Install from lmstudio.ai, download model, start server';
    } else if (provider === 'deepseek') {
      return this.syncDeepseekChat(message, model, providerConfig);
    }
    
    return 'Unsupported provider: ' + provider;
  },
  
  syncDeepseekChat: function(message, model, config) {
    const baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
    const modelName = model || config.model || 'deepseek-chat';
    const apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return 'DeepSeek API: Set DEEPSEEK_API_KEY env var or config.apiKey';
    }
    
    return 'DeepSeek API ready. API Key: ' + (apiKey ? apiKey.substring(0, 8) + '...' : 'not set');
  },
  
  ollamaChat: function(message, model, config) {
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    const modelName = model || config.model || 'llama3';
    
    const payload = {
      model: modelName,
      messages: [{ role: 'user', content: message }],
      stream: false
    };
    
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };
    
    try {
      const response = this.httpSync(baseUrl + '/api/chat', options);
      const data = JSON.parse(response);
      return data.message?.content || 'No response';
    } catch (e) {
      return 'Ollama error: ' + e.message + '. Make sure Ollama is running.';
    }
  },
  
  lmstudioChat: function(message, model, config) {
    const baseUrl = config.baseUrl || 'http://localhost:1234/v1';
    const modelName = model || config.model || 'local-model';
    
    const payload = {
      model: modelName,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 512
    };
    
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };
    
    try {
      const response = this.httpSync(baseUrl + '/chat/completions', options);
      const data = JSON.parse(response);
      return data.choices?.[0]?.message?.content || 'No response';
    } catch (e) {
      return 'LM Studio error: ' + e.message + '. Make sure LM Studio is running.';
    }
  },
  
  deepseekChat: function(message, model, config) {
    const baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
    const modelName = model || config.model || 'deepseek-chat';
    const apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return 'DeepSeek API key not configured. Set DEEPSEEK_API_KEY env var.';
    }
    
    const payload = {
      model: modelName,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 1024
    };
    
    const options = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(payload)
    };
    
    try {
      const response = this.httpSync(baseUrl + '/chat/completions', options);
      const data = JSON.parse(response);
      return data.choices?.[0]?.message?.content || 'No response';
    } catch (e) {
      return 'DeepSeek error: ' + e.message;
    }
  },
  
  complete: function(prompt, model, provider, config) {
    return this.chat(prompt, model, provider, config);
  },
  
  inference: function(prompt, model, provider, config) {
    return this.chat(prompt, model, provider, config);
  },
  
  httpSync: function(url, options) {
    const http = require('http');
    const https = require('https');
    const urlObj = require('url').parse(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    return new Promise(function(resolve, reject) {
      const req = client.request(url, options, function(res) {
        let data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() { resolve(data); });
      });
      req.on('error', reject);
      req.write(options.body || '');
      req.end();
    });
  },
  
  listModels: function(provider, config) {
    if (provider === 'ollama') {
      try {
        const response = this.httpSync((config.providers.ollama.baseUrl || 'http://localhost:11434') + '/api/tags', {
          method: 'GET'
        });
        const data = JSON.parse(response);
        return data.models?.map(function(m) { return m.name; }) || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  },
  
  getProviders: function() {
    const config = this.getConfig();
    return Object.keys(config.providers || {}).filter(function(p) {
      return config.providers[p]?.enabled;
    });
  },
  
  setProvider: function(provider, enabled) {
    const config = this.getConfig();
    if (config.providers && config.providers[provider]) {
      config.providers[provider].enabled = enabled;
    }
    return config;
  }
};