import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI Configuration
 * Auto-generates interactive API documentation
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Finance Dashboard API',
    version: '1.0.0',
    description:
      'RESTful backend API for a finance dashboard system. Features JWT authentication, role-based access control (RBAC), financial record management, and dashboard analytics.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your access token obtained from /auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '660f1a2b3c4d5e6f7a8b9c0d' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['viewer', 'analyst', 'admin'], example: 'viewer' },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '660f1a2b3c4d5e6f7a8b9c0d' },
          amount: { type: 'number', example: 5000 },
          type: { type: 'string', enum: ['income', 'expense'], example: 'income' },
          category: {
            type: 'string',
            enum: [
              'salary', 'freelance', 'investment', 'business', 'food', 'transport',
              'utilities', 'entertainment', 'health', 'education', 'shopping',
              'rent', 'insurance', 'other',
            ],
            example: 'salary',
          },
          description: { type: 'string', example: 'Monthly salary' },
          date: { type: 'string', format: 'date-time' },
          createdBy: { $ref: '#/components/schemas/User' },
          isDeleted: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer', example: 1 },
          perPage: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 32 },
          totalPages: { type: 'integer', example: 4 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Please provide a valid email' },
                value: { type: 'string', example: 'invalid-email' },
              },
            },
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Scan route files for JSDoc annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
