import axios from "axios";

type ErrorPayload = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export function getValidationErrors(error: unknown) {
  if (!axios.isAxiosError<ErrorPayload>(error)) {
    return {};
  }

  const errors = error.response?.data?.errors;

  if (!errors) {
    return {};
  }

  return Object.entries(errors).reduce<Record<string, string>>(
    (acc, [field, value]) => {
      if (Array.isArray(value)) {
        acc[field] = value[0] ?? "Input tidak valid.";
        return acc;
      }

      if (typeof value === "string") {
        acc[field] = value;
      }

      return acc;
    },
    {}
  );
}

export function getAuthErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ErrorPayload>(error)) {
    return "Terjadi kesalahan. Coba lagi.";
  }

  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401) {
    return message || "Email atau password salah.";
  }

  if (status === 403) {
    return message || "Akun tidak aktif atau akses ditolak.";
  }

  if (status === 409) {
    return message || "Data sudah terdaftar.";
  }

  if (status === 422) {
    return message || "Data yang dikirim tidak valid.";
  }

  if (status === 429) {
    return message || "Terlalu banyak percobaan. Coba lagi nanti.";
  }

  return message || "Terjadi kesalahan pada server.";
}