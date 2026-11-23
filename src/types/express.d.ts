// src/types/express.d.ts
import type { WorkspaceMember, Project } from '@/generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      workspaceMember?: WorkspaceMember; // Dùng cho middleware workspace sau này
      project?: Project; // Dùng cho middleware project sau này
    }
  }
}
export {};