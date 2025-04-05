import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { base64ToBuffer, transformImage } from "./openai";
import { Buffer } from "buffer";

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  storage: multer.memoryStorage(),
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/user", async (req, res) => {
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Create a new user if not found
      user = await storage.createUser({ email, points: 100 });
    }
    
    res.json(user);
  });
  
  // Package routes
  app.get("/api/packages", async (_req, res) => {
    const packages = await storage.getAllPackages();
    res.json(packages);
  });
  
  // Style routes
  app.get("/api/styles", async (_req, res) => {
    const styles = await storage.getAllStyles();
    res.json(styles);
  });
  
  // Redeem code routes
  app.post("/api/redeem", async (req, res) => {
    const schema = z.object({
      code: z.string(),
      email: z.string().email(),
    });
    
    try {
      const { code, email } = schema.parse(req.body);
      
      // Find redeem code
      const redeemCode = await storage.getRedeemCode(code);
      
      if (!redeemCode) {
        return res.status(400).json({ message: "Invalid redeem code" });
      }
      
      if (redeemCode.isUsed) {
        return res.status(400).json({ message: "This code has already been used" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add points to user
      const updatedUser = await storage.updateUserPoints(user.id, user.points + redeemCode.points);
      
      // Mark code as used
      await storage.markRedeemCodeAsUsed(redeemCode.id);
      
      res.json({ user: updatedUser, pointsAdded: redeemCode.points });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Purchase package route
  app.post("/api/purchase", async (req, res) => {
    const schema = z.object({
      packageId: z.number(),
      email: z.string().email(),
    });
    
    try {
      const { packageId, email } = schema.parse(req.body);
      
      // Find package
      const pkg = await storage.getPackage(packageId);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add points to user
      const updatedUser = await storage.updateUserPoints(user.id, user.points + pkg.points);
      
      res.json({ user: updatedUser, pointsAdded: pkg.points });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Image upload route
  app.post("/api/upload", upload.array("images", 50), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      const email = req.body.email;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Save original images and create image records
      const images = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          // Convert buffer to base64
          const base64 = file.buffer.toString("base64");
          const originalUrl = `data:${file.mimetype};base64,${base64}`;
          
          // Create image record
          return storage.createImage({
            userId: user.id,
            originalUrl,
            transformedUrl: undefined,
            style: req.body.style,
            status: "pending",
          });
        })
      );
      
      res.json({ images });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Image transformation route
  app.post("/api/transform", async (req, res) => {
    const schema = z.object({
      imageIds: z.array(z.number()),
      style: z.string(),
      email: z.string().email(),
    });
    
    try {
      const { imageIds, style, email } = schema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get style info to determine point cost
      const styleInfo = await storage.getStyleByName(style);
      
      if (!styleInfo) {
        return res.status(404).json({ message: "Style not found" });
      }
      
      // Calculate total cost
      const totalCost = styleInfo.pointCost * imageIds.length;
      
      // Check if user has enough points
      if (user.points < totalCost) {
        return res.status(400).json({ message: "Not enough points" });
      }
      
      // Deduct points
      await storage.updateUserPoints(user.id, user.points - totalCost);
      
      // Process each image (start the process but don't wait for completion)
      imageIds.forEach(async (imageId) => {
        try {
          console.log(`Starting transformation process for image ID: ${imageId} with style: ${style}`);
          const image = await storage.getImage(imageId);
          
          if (!image) {
            console.error(`Image ${imageId} not found`);
            return;
          }
          
          console.log(`Found image ${imageId}, original URL length: ${image.originalUrl.length} characters`);
          
          // Parse base64 from original URL
          const buffer = base64ToBuffer(image.originalUrl);
          console.log(`Successfully parsed image ${imageId} to buffer, size: ${buffer.length} bytes`);
          
          // Transform image
          console.log(`Calling transformImage for image ${imageId}...`);
          const transformedUrl = await transformImage(buffer, style, imageId);
          console.log(`Image ${imageId} transformation completed successfully`);
          
          // Update image with transformed URL
          await storage.updateImageStatus(imageId, "completed", transformedUrl);
          console.log(`Image ${imageId} status updated to "completed"`);
        } catch (error: any) {
          console.error(`Error transforming image ${imageId}:`, error);
          
          // More detailed error logging
          if (error.message) {
            console.error(`Error message for image ${imageId}: ${error.message}`);
          }
          
          await storage.updateImageStatus(imageId, "failed");
          console.log(`Image ${imageId} status updated to "failed"`);
        }
      });
      
      res.json({ message: "Transformation started", totalCost });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      
      console.error("Error transforming images:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get user images route
  app.get("/api/images", async (req, res) => {
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Find user
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user images
    const images = await storage.getUserImages(user.id);
    
    res.json(images);
  });
  
  // Get image status route
  app.get("/api/images/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid image ID" });
    }
    
    // Get image
    const image = await storage.getImage(id);
    
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }
    
    res.json(image);
  });

  const httpServer = createServer(app);
  return httpServer;
}
