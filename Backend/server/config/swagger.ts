import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Courses Platform API',
      version: '1.0.0',
      description: 'A comprehensive API for a global courses learning platform with PocketBase integration',
      contact: {
        name: 'API Support',
        email: 'support@coursesplatform.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string', enum: ['student', 'instructor', 'admin'] },
            verified: { type: 'boolean' },
            is_active: { type: 'boolean' },
            avatar_url: { type: 'string', format: 'uri' },
            bio: { type: 'string' },
            last_login: { type: 'string', format: 'date-time' },
            created: { type: 'string', format: 'date-time' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            overview: { type: 'string' },
            objective: { type: 'string' },
            thumbnail_url: { type: 'string', format: 'uri' },
            difficulty_level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            estimated_duration: { type: 'number' },
            is_published: { type: 'boolean' },
            tags: { type: 'array', items: { type: 'string' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Module: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            course_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            sequence_order: { type: 'integer' },
            content_url: { type: 'string', format: 'uri' },
            video_url: { type: 'string', format: 'uri' },
            duration_minutes: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'string' },
            course_id: { type: 'string' },
            progress_percentage: { type: 'number', minimum: 0, maximum: 100 },
            is_completed: { type: 'boolean' },
            certificate_issued: { type: 'boolean' },
            completion_date: { type: 'string', format: 'date' },
            last_accessed_at: { type: 'string', format: 'date-time' },
            enrolled_at: { type: 'string', format: 'date-time' }
          }
        },
        Quiz: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            module_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            time_limit_minutes: { type: 'number' },
            passing_score: { type: 'number', minimum: 0, maximum: 100 },
            max_attempts: { type: 'integer' },
            tried_attempts: { type: 'integer' },
            is_mandatory: { type: 'boolean' },
            is_completed: { type: 'boolean' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  type: { type: 'string', enum: ['multiple_choice', 'true_false', 'short_answer'] },
                  options: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Certificate: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'string' },
            course_id: { type: 'string' },
            issued_at: { type: 'string', format: 'date' },
            certificate_url: { type: 'string', format: 'uri' },
            verification_code: { type: 'string' },
            created: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Courses',
        description: 'Course management operations'
      },
      {
        name: 'Modules',
        description: 'Course module management'
      },
      {
        name: 'Enrollments',
        description: 'Course enrollment and progress tracking'
      },
      {
        name: 'Quizzes',
        description: 'Quiz viewing and attempt submission'
      },
      {
        name: 'Certificates',
        description: 'Certificate issuance and verification'
      },
      {
        name: 'Users',
        description: 'User management and profiles'
      }
    ]
  },
  apis: ['./server/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Courses Platform API Documentation'
  }));

  // Serve the raw OpenAPI specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 API Documentation available at /api-docs');
}
