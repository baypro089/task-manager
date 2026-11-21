// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',        // tùy chọn, nếu bạn cần seed dữ liệu
  },
  datasource: {
    url: env('DATABASE_URL'),           // đọc từ .env
  },
});