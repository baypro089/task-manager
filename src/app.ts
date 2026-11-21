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
import { errorHandler } from './middlewares/error.middleware.js';
import apiRoutes from "./routes/index.js";
import { swaggerUiServe, swaggerUiSetup } from "./configuration/swagger.js";

const app: Application = express();

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

// Swagger UI endpoint
app.use('/api-docs', swaggerUiServe, swaggerUiSetup);

// Register API routes
app.use("/api/v1", apiRoutes);

// Health check endpoint — hữu ích cho load balancer / Kubernetes
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});


// Global error handler (phải đặt SAU tất cả middleware và routes)
app.use(errorHandler);

export default app;
