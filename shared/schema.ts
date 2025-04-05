import { pgTable, text, serial, integer, timestamp, array } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  points: integer("points").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Image model
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  originalUrl: text("original_url").notNull(),
  transformedUrl: text("transformed_url"),
  style: text("style").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
});

// Redemption code model
export const redeemCodes = pgTable("redeem_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  points: integer("points").notNull(),
  isUsed: integer("is_used").notNull().default(0),
});

export const insertRedeemCodeSchema = createInsertSchema(redeemCodes).omit({
  id: true,
});

// Package model
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  price: integer("price").notNull(),
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
});

// Style model
export const styles = pgTable("styles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  pointCost: integer("point_cost").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  exampleBeforeUrl: text("example_before_url").notNull(),
  exampleAfterUrl: text("example_after_url").notNull(),
});

export const insertStyleSchema = createInsertSchema(styles).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;

export type RedeemCode = typeof redeemCodes.$inferSelect;
export type InsertRedeemCode = z.infer<typeof insertRedeemCodeSchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

export type Style = typeof styles.$inferSelect;
export type InsertStyle = z.infer<typeof insertStyleSchema>;
