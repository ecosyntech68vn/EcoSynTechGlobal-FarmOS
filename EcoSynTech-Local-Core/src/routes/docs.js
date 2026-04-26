const express = require('express');
const router = express.Router();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoSynTech IoT API',
      version: '2.0.0',
      description: 'REST API for IoT Agriculture Platform'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, { explorer: true }));
router.get('/json', (req, res) => res.json(specs));

module.exports = router;