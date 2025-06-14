// schema/deleteIssueSchema.ts
import { z } from "zod";

export const deleteIssueSchema = z.object({
  issueId: z.number(),
});
