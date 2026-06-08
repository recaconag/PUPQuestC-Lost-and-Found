import { z } from "zod";

const createLostItem = z.object({
  body: z.object({
    lostItemName: z.string({
      required_error: "Item name is required",
    }).trim().min(1, "Item name cannot be empty"),
    categoryId: z.string({
      required_error: "Category is required",
    }).uuid("Invalid category ID format"),
    location: z.string({
      required_error: "Location where the item was last seen is required",
    }).trim(),
    description: z.string({
      required_error: "Please provide a brief description of the item",
    }).trim().min(5, "Description must be at least 5 characters long"),
    img: z.string({
      required_error: "An image is required for identification",
    }).min(1, "Image is required"),
    date: z.string({
      required_error: "Lost date is required",
    }).refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format.",
    }).refine((val) => new Date(val) <= new Date(), {
      message: "Date cannot be in the future.",
    }),
  }),
});

const updateLostItem = z.object({
  body: z.object({
    lostItemName: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    location: z.string().trim().optional(),
    description: z.string().trim().optional(),
    img: z.string().optional(),
    date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid date format.",
    }).refine((val) => !val || new Date(val) <= new Date(), {
      message: "Date cannot be in the future.",
    }),
    isFound: z.boolean().optional(),
  }),
});

export const LostItemSchema = {
  createLostItem,
  updateLostItem,
};
