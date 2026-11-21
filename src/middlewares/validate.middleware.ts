import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

type Target = 'body' | 'query' | 'params';

export const validate = (schema: ZodTypeAny, target: Target = 'body') =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req[target]);
            if (target === 'query') {
                Object.assign(req.query, parsed);
            } else {
                (req as any)[target] = parsed;
            }
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({ success: false, errors: error.issues });
                return;
            }
            next(error);
        }
    };