import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";

import uploadRoutes from "./routes/uploadRoutes.js";
import verifyRoutes from "./routes/verifyRoutes.js";

export const app = express();

app.use(helmet());
app.use(morgan("dev"));

const allowedOrigin = env.clientUrl;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin) and configured frontend origin.
      if (!origin || origin === allowedOrigin) {
        return callback(null, true);
      }

      // In development, allow localhost Vite dev server ports.
      if (
        env.nodeEnv !== "production" &&
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());

app.use("/api/verify", verifyRoutes);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/upload", uploadRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: "Internal server error",
    details: env.nodeEnv === "development" ? error.message : undefined
  });
});
