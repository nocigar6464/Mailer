// src/schemas/quote.ts
import { z } from "zod";

export const quoteItemSchema = z.object({
  description: z.string().min(2),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative()
});

export const quoteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  currency: z.enum(["CLP", "USD"]).default("CLP"),
  includeVAT: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  items: z.array(quoteItemSchema).min(1)
});
export type QuoteInput = z.infer<typeof quoteSchema>;
