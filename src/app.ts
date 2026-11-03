// src/app.ts
import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app: Application = express();

// ============================================
// 1. Global Middleware (thứ tự rất quan trọng!)
// ============================================

// Bảo mật HTTP headers
app.use(helmet());

// Cho phép cross-origin requests
app.use(cors());

// Parse JSON body (giới hạn kích thước để tránh DoS)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging HTTP requests (chỉ log khi không phải môi trường test)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ============================================
// 2. Routes
// ============================================
// import { userRouter } from './modules/users/user.routes.js';

// app.use('/api/users', userRouter);

// Health check endpoint — hữu ích cho load balancer / Kubernetes
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// 3. 404 Handler (phải đặt SAU tất cả routes)
// ============================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ============================================
// 4. Global Error Handler (phải đặt CUỐI CÙNG)
// ============================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Error:", err);

  const statusCode = (err as any).statusCode ?? 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

export default app;
