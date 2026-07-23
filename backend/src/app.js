import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import fs from 'fs';
import path from 'path';

import { env } from "./config/env.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import customerOrderRoutes from "./routes/customer.order.routes.js";
import adminOrderRoutes from "./routes/admin.order.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import addressRoutes from "./routes/address.routes.js";
import publicProductRoutes from "./routes/public.product.routes.js";
import publicCategoryRoutes from "./routes/public.category.routes.js";
import rewardRoutes from "./routes/reward.routes.js";
import adminRewardRoutes from "./routes/admin.reward.routes.js";

const app = express();
app.disable("etag");
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5001",
    "http://127.0.0.1:5001"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma"
  ]
};

const buildAuthLimiter = ({ max, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => req.ip,
    message: {
      success: false,
      message
    }
  });

const loginLimiter = buildAuthLimiter({
  max: 20,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please try again later."
});

const registerLimiter = buildAuthLimiter({
  max: 10,
  message: "Too many registration attempts. Please try again later."
});

const forgotPasswordLimiter = buildAuthLimiter({
  max: 10,
  message: "Too many password reset requests. Please try again later."
});

const resetPasswordLimiter = buildAuthLimiter({
  max: 10,
  message: "Too many password reset attempts. Please try again later."
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.set("trust proxy", 1);

// Serve static files from backend directory
app.use('/defaultProduct.png', express.static('defaultProduct.png'));
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}, express.static('uploads'));
app.use(express.static('public'));

// New image serving endpoint to bypass cache
app.get('/api/v1/images/products/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'products', filename);
  
  console.log(`=== IMAGE REQUEST ===`);
  console.log(`Filename: ${filename}`);
  console.log(`File path: ${filePath}`);
  console.log(`Request headers:`, req.headers);
  console.log(`Origin: ${req.headers.origin}`);
  
  // Set CORS headers BEFORE anything else
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  console.log(`Headers set, checking file exists: ${fs.existsSync(filePath)}`);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log(`Image found, sending: ${filename}`);
    const fileStats = fs.statSync(filePath);
    console.log(`File size: ${fileStats.size} bytes`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error sending file: ${err}`);
        res.status(500).send('Error serving image');
      } else {
        console.log(`File sent successfully: ${filename}`);
      }
    });
  } else {
    console.log(`Image not found: ${filename}`);
    res.status(404).send('Image not found');
  }
});

// Base64 image endpoint to completely bypass CORS
app.get('/api/v1/images/base64/products/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'products', filename);
  
  console.log(`=== BASE64 IMAGE REQUEST ===`);
  console.log(`Filename: ${filename}`);
  console.log(`File path: ${filePath}`);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    try {
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 
                      filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      
      console.log(`Base64 image created, size: ${base64Image.length} characters`);
      
      // Return as JSON with base64 data
      res.json({
        success: true,
        dataUrl: dataUrl,
        filename: filename
      });
    } catch (error) {
      console.error(`Error reading file: ${error}`);
      res.status(500).json({ success: false, error: 'Error reading image' });
    }
  } else {
    console.log(`Image not found: ${filename}`);
    res.status(404).json({ success: false, error: 'Image not found' });
  }
});

// Fallback for old uploads path
app.get('/uploads/products/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'products', filename);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory Demand API is running"
  });
});

// Public routes (no authentication required)
app.use("/api/v1/public/products", publicProductRoutes);
app.use("/api/v1/public/categories", publicCategoryRoutes);

// Auth routes
app.use("/api/v1/auth", authRoutes({
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter
}));

// Protected routes (authentication required)
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/customer/orders", customerOrderRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/admin/audit", auditRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/public/products", publicProductRoutes);
app.use("/api/v1/public/categories", publicCategoryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/user/addresses", addressRoutes);
app.use("/api/v1/rewards", rewardRoutes);
app.use("/api/v1/admin/rewards", adminRewardRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/alerts", alertRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
