const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoSynTech Farm OS API',
      version: process.env.npm_package_version || '5.0.0',
      description: 'Nền tảng Nông nghiệp Thông minh IoT với AI',
      contact: {
        name: 'EcoSynTech',
        phone: '0989516698',
        email: 'kd.ecosyntech@gmail.com'
      }
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' }
    ],
    tags: [
      { name: 'Health', description: 'System health & status' },
      { name: 'Sensors', description: 'Cảm biến' },
      { name: 'Devices', description: 'Thiết bị' },
      { name: 'Rules', description: 'Quy tắc tự động' },
      { name: 'Schedules', description: 'Lịch tưới' },
      { name: 'Auth', description: 'Xác thực' }
    ],
    paths: {}
  },
  apis: [path.join(__dirname, '../routes/*.js')]
};

const swaggerSpec = swaggerJsdoc(options);

function addApiDoc(router, path, method, options) {
  const endpoint = options.tags ? `/${options.tags[0].toLowerCase()}` : '/';
  if (!swaggerSpec.paths[endpoint]) {
    swaggerSpec.paths[endpoint] = {};
  }
  swaggerSpec.paths[endpoint][method] = {
    tags: options.tags,
    summary: options.summary || '',
    description: options.description || '',
    responses: {
      200: { description: 'Success' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' }
    }
  };
}

function setupSwagger(app) {
  const swaggerUi = require('swagger-ui-express');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
  return swaggerSpec;
}

module.exports = {
  swaggerSpec,
  setupSwagger,
  addApiDoc
};