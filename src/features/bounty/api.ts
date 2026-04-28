import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import type {
  AdminBountyRecord,
  CreateBountyPayload,
  CreateBountyResponse,
  SupplierBountyRecord,
} from "@/features/bounty/types";

function extractApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const validationErrors = error.response?.data?.errors;
    const firstValidationError =
      validationErrors && typeof validationErrors === "object"
        ? Object.values(validationErrors as Record<string, string[] | string>)
            .flat()
            .find((message): message is string => typeof message === "string")
        : undefined;

    const message =
      firstValidationError ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan pada server.";

    throw new Error(message);
  }

  throw new Error("Terjadi kesalahan yang tidak diketahui.");
}

function findFirstArray<TRecord>(value: unknown): TRecord[] {
  if (Array.isArray(value)) {
    return value as TRecord[];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;

  const directKeys = [
    "data",
    "bounties",
    "items",
    "results",
    "records",
    "list",
    "rows",
  ];

  for (const key of directKeys) {
    const candidate = record[key];

    if (Array.isArray(candidate)) {
      return candidate as TRecord[];
    }
  }

  for (const key of directKeys) {
    const candidate = record[key];

    if (candidate && typeof candidate === "object") {
      const nested = findFirstArray<TRecord>(candidate);
      if (nested.length) {
        return nested;
      }
    }
  }

  for (const candidate of Object.values(record)) {
    if (candidate && typeof candidate === "object") {
      const nested = findFirstArray<TRecord>(candidate);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

export async function createBounty(payload: CreateBountyPayload) {
  try {
    const { data } = await apiClient.post<CreateBountyResponse>(
      env.ADMIN_BOUNTIES_PATH,
      payload
    );
    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function getAdminBounties() {
  try {
    const { data } = await apiClient.get(env.ADMIN_BOUNTIES_PATH);
    return findFirstArray<AdminBountyRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function getSupplierBounties() {
  try {
    const { data } = await apiClient.get(env.SUPPLIER_BOUNTIES_PATH);
    return findFirstArray<SupplierBountyRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}
