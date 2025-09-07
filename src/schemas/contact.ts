import { z } from "zod";

const phoneSchema = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
}, z.string().regex(/^[-+() 0-9]{6,20}$/, "invalid_phone")).optional();

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: phoneSchema, 
  message: z.string().min(10).max(5000),
  recaptchaToken: z.string().optional()  // si lo mandas desde el front
});

export type ContactInput = z.infer<typeof contactSchema>;
