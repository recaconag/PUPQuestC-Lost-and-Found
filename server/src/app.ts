import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import config from "./app/config/config";
import router from "./app/routes/routes";
import errorHandler from "./app/midddlewares/errorHandler";

const app: Application = express();

const ALLOWED_ORIGINS = new Set([
  config.client_url,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any localhost / 127.0.0.1 port (covers Windsurf preview proxy, Vite, etc.)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Allow explicitly whitelisted production origins
      if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

app.use(cookieParser());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send({
    success: true,
    message: "Welcome to PUPQuestC: Lost and Found Management API"
  });
});

app.use("/api", router);

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    errorDetails: {
      path: req.originalUrl,
      message: "The requested endpoint does not exist on this server."
    }
  });
});

export default app;
