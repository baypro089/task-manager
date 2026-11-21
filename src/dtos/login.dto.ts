import {z} from 'zod';
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72), // Giới hạn 72 bytes của bcrypt
});
export type LoginDto = z.infer<typeof loginSchema>;