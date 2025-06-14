import { pgTable, uuid, varchar, timestamp,text } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(), // The user-friendly name/label for the API key
  key: text("key").notNull(), // The actual API key value entered by user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});