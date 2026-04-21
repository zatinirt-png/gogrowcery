import axios from "axios";

type ErrorPayload = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

export function formatDateTimeLocalToApi(value: string) {
  if (!value) return "";

  const normalized = value.replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

export function getBountyValidationErrors(error: unknown) {
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

export function getBountyErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ErrorPayload>(error)) {
    return "Terjadi kesalahan. Coba lagi.";
  }

  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401) {
    return message || "Sesi login tidak valid. Silakan login ulang.";
  }

  if (status === 403) {
    return message || "Akses ditolak untuk membuat bounty.";
  }

  if (status === 422) {
    return message || "Data bounty tidak valid.";
  }

  return message || "Terjadi kesalahan pada server.";
}