import * as z from "zod";

export const prioritySchema = z.object({
    issueId:z.string().min(1,'Issue id is required'),
    priority:z.enum(["low","medium","high"])
})

