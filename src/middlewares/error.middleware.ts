// src/middlewares/error.middleware.ts
import type { ErrorRequestHandler } from 'express';
import { env } from '@/configuration/env.js';
import { fail } from '@/responses/common/api.response.js';
import { AppError } from '../utils/errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json(fail(err.message, err.code));
        return;
    }
    console.error('❌ Error:', err);
    const status = err.statusCode ?? 500;
    const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(status).json(fail(message));
};