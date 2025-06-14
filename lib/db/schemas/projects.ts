import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start-date", { mode: "date" }),
  endDate: timestamp("end-date", { mode: "date" }),
  githublink: text("githublink").notNull(),
  leader: text("leader").notNull(), // This will store the user-entered leader name
  userId: varchar('user_id', { length: 255 }).notNull(), // The Clerk user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

