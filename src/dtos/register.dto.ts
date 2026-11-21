import { z } from 'zod';
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72), // Giới hạn 72 bytes của bcrypt
  displayName: z.string().min(1).max(100),
});
export type RegisterDto = z.infer<typeof registerSchema>;