import type { ErrorRequestHandler } from 'express';
import { env } from '@/configuration/env.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);
    const statusCode = err.statusCode || 500;
    const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(statusCode).json({ success: false, message });
};