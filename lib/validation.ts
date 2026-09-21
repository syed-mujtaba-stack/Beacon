import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username may only contain letters, numbers and underscores",
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required").max(128),
});

// Device id comes from the decoy page's localStorage — keep it URL-safe.
export const locationSchema = z.object({
  id: z
    .string()
    .min(3, "id is too short")
    .max(48, "id is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "id contains invalid characters"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type LocationInput = z.infer<typeof locationSchema>;