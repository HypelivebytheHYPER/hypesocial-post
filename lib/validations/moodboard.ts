import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
  created_by: z.string().optional(),
});

export const UpdateProjectSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    week_notes: z.record(z.any()).optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message:
      "Request body cannot be empty. Provide at least one field to update.",
  });

export const ListItemsQuerySchema = z.object({
  project_id: z.string().min(1, "project_id is required"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const CreateItemSchema = z.object({
  project_id: z.string().min(1, "project_id is required"),
  column_date: z.string().min(1, "column_date is required"),
  type: z.string().min(1, "type is required"),
  content: z.string().optional(),
  media_url: z.string().optional(),
  platform: z.string().optional(),
  video_ratio: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  likes: z.string().optional(),
  comments: z.string().optional(),
  linked_post_id: z.string().optional(),
  sort_order: z.number().optional(),
});

export const UpdateItemSchema = z
  .object({
    column_date: z.string().optional(),
    sort_order: z.number().optional(),
    content: z.string().optional(),
    media_url: z.string().optional(),
    platform: z.string().optional(),
    video_ratio: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    likes: z.string().optional(),
    comments: z.string().optional(),
    linked_post_id: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message:
      "Request body cannot be empty. Provide at least one field to update.",
  });

export const ReorderItemsSchema = z.object({
  project_id: z.string().min(1, "project_id is required"),
  items: z
    .array(
      z.object({
        item_id: z.string(),
        column_date: z.string(),
        sort_order: z.number(),
      }),
    )
    .min(1, "items must be a non-empty array"),
});

export const MoodboardUploadSchema = z.object({
  filename: z.string().min(1, "filename is required"),
  content_type: z.string().min(1, "content_type is required"),
  project_id: z.string().min(1, "project_id is required"),
  size: z.number().int().positive().optional(),
});
