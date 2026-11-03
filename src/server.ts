// src/server.ts
import 'dotenv/config';
import app from './app.js';

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

// Graceful shutdown — quan trọng khi deploy trên Docker/K8s
const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Đang tắt server...`);
  server.close(() => {
    console.log('✅ Server đã tắt hoàn toàn');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));