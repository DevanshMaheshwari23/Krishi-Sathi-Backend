import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import listingRoutes from "./routes/listingRoutes";

const app = express();

// CORS - MUST be first, before any other middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Allow localhost and all Vercel deployments
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://krishi-sathi-frontend.vercel.app'
  ];
  
  // Check if origin is allowed or is a Vercel preview deployment
  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    /^https:\/\/.*\.vercel\.app$/.test(origin)
  );
  
  if (isAllowed || !origin) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

// Other middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.get("/", (_req, res) => {
  res.json({ 
    message: "Krishi Sathi API",
    status: "running",
    version: "1.0.0"
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/listings", listingRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

export default app;
