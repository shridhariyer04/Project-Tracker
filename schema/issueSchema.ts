// /schema/issueSchema.ts
import * as z from "zod";

export const issueSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be under 100 characters"),

  description: z
    .string()
    .max(1000, "Description too long")
    .optional(),

  priority: z
    .enum(["low", "medium", "high"])
    .default("low")
    .optional(),

  status: z
    .enum(["open", "in_progress", "closed"])
    .default("open")
    .optional(),

  projectId: z
    .string()
    .min(1, "Project ID is required"),
});
