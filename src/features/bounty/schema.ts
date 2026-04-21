import { z } from "zod";

export const bountyItemSchema = z.object({
  item_name: z.string().trim().min(1, "Nama item wajib diisi"),
  target_quantity: z
    .number()
    .refine((value) => Number.isFinite(value), {
      message: "Target quantity harus berupa angka",
    })
    .positive("Target quantity harus lebih dari 0"),
  unit: z.string().trim().min(1, "Satuan wajib diisi"),
  notes: z.string().trim().optional(),
});

export const createBountySchema = z.object({
  client_name: z.string().trim().min(1, "Client name wajib diisi"),
  title: z.string().trim().min(1, "Bounty title wajib diisi"),
  description: z.string().trim().optional(),
  deadline_at: z.string().min(1, "Deadline wajib diisi"),
  items: z.array(bountyItemSchema).min(1, "Minimal satu item bounty wajib ada"),
});

export type CreateBountyFormValues = z.infer<typeof createBountySchema>;
export type BountyItemFormValues = z.infer<typeof bountyItemSchema>;