// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '@/configuration/env.js';

export interface TokenPayload {
  sub: string;
  jti: string;
  type: 'access' | 'refresh';
}

export function signAccessToken(userId: string): string {
  const payload: TokenPayload = {
    sub: userId,
    jti: randomUUID(),
    type: 'access',
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(userId: string): string {
  const payload: TokenPayload = {
    sub: userId,
    jti: randomUUID(),
    type: 'refresh',
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}