import * as z from "zod";

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters"),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters")
    .max(255, "Description must be at most 255 characters")
    .optional(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .nullable(), // For optional date fields that can be null
  endDate: z
    .string()
    .datetime()
    .optional()
    .nullable(),
  githublink: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .nullable(),
  leader: z
    .string()
    .min(1, "Leader is required"),
  userId: z
    .string()
    .uuid("Invalid user ID"), // assuming you use UUIDs for users
  apikey: z
    .string()
    .min(10, "API key should be at least 10 characters"),
});
