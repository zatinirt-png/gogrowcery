import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^[0-9+\-\s()]+$/.test(value), {
    message: "Format nomor telepon tidak valid",
  });

const requiredPhoneSchema = z
  .string()
  .trim()
  .min(1, "Nomor HP wajib diisi")
  .refine((value) => /^[0-9+\-\s()]+$/.test(value), {
    message: "Format nomor HP tidak valid",
  });

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "Format email tidak valid",
  });



export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  remember: z.boolean().optional(),
});

export const buyerRegisterSchema = z
  .object({
    name: z.string().trim().min(1, "Nama akun wajib diisi"),
    full_name: z.string().trim().min(1, "Nama lengkap wajib diisi"),
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username hanya boleh huruf, angka, dan underscore"
      ),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    phone: phoneSchema,
    password: z.string().min(8, "Password minimal 8 karakter"),
    password_confirmation: z
      .string()
      .min(1, "Konfirmasi password wajib diisi"),
    terms: z.boolean().refine((value) => value === true, {
      message: "Kamu harus menyetujui syarat dan kebijakan",
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Konfirmasi password tidak sama",
  });

export const supplierRegisterSchema = z
  .object({
    name: z.string().trim().min(1, "Nama akun wajib diisi"),
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username hanya boleh huruf, angka, dan underscore"
      ),
    email: optionalEmailSchema,
    password: z.string().min(8, "Password minimal 8 karakter"),
    password_confirmation: z
      .string()
      .min(1, "Konfirmasi password wajib diisi"),
    terms: z.boolean().refine((value) => value === true, {
      message: "Kamu harus menyetujui syarat dan kebijakan",
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Konfirmasi password tidak sama",
  });

export const supplierAdminStepOneSchema = z
  .object({
    name: z.string().trim().min(1, "Nama akun wajib diisi"),
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username hanya boleh huruf, angka, dan underscore"
      ),
    email: optionalEmailSchema,
    password: z.string().min(8, "Password minimal 8 karakter"),
    password_confirmation: z
      .string()
      .min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Konfirmasi password tidak sama",
  });

export const supplierAdminStepTwoSchema = z.object({
  nama_lengkap: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  no_ktp: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  tempat_lahir: z.string().trim().min(1, "Tempat lahir wajib diisi"),
  tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenis_kelamin: z.string().min(1, "Jenis kelamin wajib dipilih"),
  no_hp: requiredPhoneSchema,
  alamat_domisili: z.string().trim().min(1, "Alamat domisili wajib diisi"),
  desa: z.string().trim().min(1, "Desa wajib diisi"),
  kecamatan: z.string().trim().min(1, "Kecamatan wajib diisi"),
  kabupaten: z.string().trim().min(1, "Kabupaten wajib diisi"),
});

export const supplierLandSchema = z.object({
  nama_lahan: z.string().trim().min(1, "Nama lahan wajib diisi"),
  nama_pemilik: z.string().trim().min(1, "Nama pemilik wajib diisi"),
  no_hp: requiredPhoneSchema,
  alamat_lahan: z.string().trim().min(1, "Alamat lahan wajib diisi"),
  desa: z.string().trim().min(1, "Desa wajib diisi"),
  kecamatan: z.string().trim().min(1, "Kecamatan wajib diisi"),
  kabupaten: z.string().trim().min(1, "Kabupaten wajib diisi"),
  provinsi: z.string().trim().min(1, "Provinsi wajib diisi"),
  kepemilikan: z.string().min(1, "Status kepemilikan wajib dipilih"),
  luas_lahan_m2: z
    .number()
    .refine((value) => Number.isFinite(value), {
      message: "Luas lahan harus berupa angka",
    })
    .positive("Luas lahan harus lebih dari 0"),
  status_aktif: z.string().min(1, "Status aktif wajib dipilih"),
});

export const supplierAdminStepThreeSchema = z.object({
  lands: z
    .array(supplierLandSchema)
    .min(1, "Minimal harus ada satu data lahan"),
});

export const supplierAdminStepFourSchema = z
  .object({
    payout_method: z.string().min(1, "Metode payout wajib dipilih"),
    bank_name: z.string().trim().optional(),
    bank_account_number: z.string().trim().optional(),
    bank_account_name: z.string().trim().optional(),
    ewallet_name: z.string().trim().optional(),
    ewallet_account_number: z.string().trim().optional(),
    ewallet_account_name: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payout_method === "transfer") {
      if (!data.bank_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bank_name"],
          message: "Nama bank wajib diisi",
        });
      }

      if (!data.bank_account_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bank_account_number"],
          message: "Nomor rekening wajib diisi",
        });
      }

      if (!data.bank_account_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bank_account_name"],
          message: "Nama pemilik rekening wajib diisi",
        });
      }
    }

    if (data.payout_method === "ewallet") {
      if (!data.ewallet_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ewallet_name"],
          message: "Nama e-wallet wajib diisi",
        });
      }

      if (!data.ewallet_account_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ewallet_account_number"],
          message: "Nomor akun e-wallet wajib diisi",
        });
      }

      if (!data.ewallet_account_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ewallet_account_name"],
          message: "Nama pemilik akun e-wallet wajib diisi",
        });
      }
    }
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type BuyerRegisterFormValues = z.infer<typeof buyerRegisterSchema>;
export type SupplierRegisterFormValues = z.infer<typeof supplierRegisterSchema>;
export type SupplierAdminStepOneValues = z.infer<
  typeof supplierAdminStepOneSchema
>;
export type SupplierAdminStepTwoValues = z.infer<
  typeof supplierAdminStepTwoSchema
>;
export type SupplierAdminStepThreeValues = z.infer<
  typeof supplierAdminStepThreeSchema
>;
export type SupplierAdminLandValues = z.infer<typeof supplierLandSchema>;
export type SupplierAdminStepFourValues = z.infer<
  typeof supplierAdminStepFourSchema
>;

export const adminSupplierPayoutSchema = z
  .object({
    payout_method: z.string().min(1, "Metode payout wajib dipilih"),
    bank_name: z.string().trim().optional(),
    bank_account_number: z.string().trim().optional(),
    bank_account_name: z.string().trim().optional(),
    ewallet_name: z.string().trim().optional(),
    ewallet_account_number: z.string().trim().optional(),
    ewallet_account_name: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payout_method === "transfer") {
      if (!data.bank_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bank_name"],
          message: "Nama bank wajib diisi",
        });
      }

      if (!data.bank_account_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bank_account_number"],
          message: "Nomor rekening wajib diisi",
        });
      }

      if (!data.bank_account_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bank_account_name"],
          message: "Nama pemilik rekening wajib diisi",
        });
      }
    }

    if (data.payout_method === "ewallet") {
      if (!data.ewallet_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ewallet_name"],
          message: "Nama e-wallet wajib diisi",
        });
      }

      if (!data.ewallet_account_number) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ewallet_account_number"],
          message: "Nomor akun e-wallet wajib diisi",
        });
      }

      if (!data.ewallet_account_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ewallet_account_name"],
          message: "Nama pemilik akun e-wallet wajib diisi",
        });
      }
    }
  });

export const adminCreateSupplierSchema = z.object({
  name: z.string().trim().min(1, "Nama supplier wajib diisi"),
  email: optionalEmailSchema,
  nama_lengkap: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  no_ktp: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  tempat_lahir: z.string().trim().min(1, "Tempat lahir wajib diisi"),
  tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenis_kelamin: z.string().min(1, "Jenis kelamin wajib dipilih"),
  no_hp: requiredPhoneSchema,
  alamat_domisili: z.string().trim().min(1, "Alamat domisili wajib diisi"),
  desa: z.string().trim().min(1, "Desa wajib diisi"),
  kecamatan: z.string().trim().min(1, "Kecamatan wajib diisi"),
  kabupaten: z.string().trim().min(1, "Kabupaten wajib diisi"),
  lands: z
    .array(supplierLandSchema)
    .min(1, "Minimal harus ada satu data lahan"),
  payout: adminSupplierPayoutSchema,
});

export type AdminCreateSupplierFormValues = z.infer<
  typeof adminCreateSupplierSchema
>;