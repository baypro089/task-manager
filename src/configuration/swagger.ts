// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js'; // Giả sử bạn có file env

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Manager API',
            version: '1.0.0',
            description: 'Tài liệu API cho ứng dụng Task Manager',
        },
        servers: [
            {
                url: `http://localhost:${env.PORT ?? 3000}/api/v1`,
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    required: ['id', 'email', 'displayName'],
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        displayName: {
                            type: 'string',
                        },
                    },
                },
                Workspace: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        ownerId: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                WorkspaceWithCounts: {
                    allOf: [
                        { $ref: '#/components/schemas/Workspace' },
                        {
                            type: 'object',
                            properties: {
                                counts: {
                                    type: 'object',
                                    properties: {
                                        members: { type: 'integer' },
                                        projects: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    ],
                },
                WorkspaceMember: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string', format: 'uuid' },
                        role: { type: 'string', enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] },
                        joinedAt: { type: 'string', format: 'date-time' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                email: { type: 'string', format: 'email' },
                                displayName: { type: 'string' },
                                avatarUrl: { type: 'string', nullable: true },
                            },
                        },
                    },
                },
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        workspaceId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        color: { type: 'string', nullable: true },
                        isArchived: { type: 'boolean' },
                        createdById: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                ProjectWithCounts: {
                    allOf: [
                        { $ref: '#/components/schemas/Project' },
                        {
                            type: 'object',
                            properties: {
                                counts: {
                                    type: 'object',
                                    properties: {
                                        tasks: { type: 'integer' },
                                        statuses: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    ],
                },
                TaskStatus: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        projectId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        position: { type: 'integer' },
                        isDone: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                ProjectWithStatuses: {
                    allOf: [
                        { $ref: '#/components/schemas/Project' },
                        {
                            type: 'object',
                            properties: {
                                statuses: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/TaskStatus' },
                                },
                            },
                        },
                    ],
                },
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }], // Áp dụng toàn cục (có thể override ở từng route)
    },
    // Đường dẫn đến các file chứa JSDoc annotations
    apis: ['./src/routes/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }', // Tùy chọn ẩn topbar
});