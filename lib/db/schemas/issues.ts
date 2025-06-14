import { pgTable, text, uuid, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const issues = pgTable('issues', {
    id: serial('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id),
    title: text('title').notNull(),
    description: text('description'),
    userId: varchar('user_id', { length: 255 }).notNull(),
    status: text('status').default('open'),
    priority: text('priority').default('low'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(), // Add this field
});