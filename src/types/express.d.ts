// src/types/express.d.ts
import type { WorkspaceMember } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      workspaceMember?: WorkspaceMember; // Dùng cho middleware workspace sau này
    }
  }
}
export {};