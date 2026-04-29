import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import type {
  AdminBountyRecord,
  CreateBountyPayload,
  CreateBountyResponse,
  SupplierBountyRecord,
} from "@/features/bounty/types";

export type BountyStatus = "draft" | "published" | "closed" | "cancelled" | string;

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
  if (Array.isArray(value)) return value as TRecord[];

  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const directKeys = ["data", "bounties", "items", "results", "records", "list", "rows"];

  for (const key of directKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as TRecord[];
  }

  for (const key of directKeys) {
    const candidate = record[key];

    if (candidate && typeof candidate === "object") {
      const nested = findFirstArray<TRecord>(candidate);
      if (nested.length) return nested;
    }
  }

  for (const candidate of Object.values(record)) {
    if (candidate && typeof candidate === "object") {
      const nested = findFirstArray<TRecord>(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
}

function findFirstObject<TRecord>(value: unknown): TRecord | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    return (value[0] as TRecord | undefined) ?? null;
  }

  const record = value as Record<string, unknown>;
  const directKeys = ["data", "bounty", "item", "record", "result"];

  for (const key of directKeys) {
    const candidate = record[key];

    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as TRecord;
    }
  }

  return value as TRecord;
}

function normalizeBountyList<TRecord>(payload: unknown) {
  return findFirstArray<TRecord>(payload);
}

function normalizeBountyDetail<TRecord>(payload: unknown) {
  const detail = findFirstObject<TRecord>(payload);
  if (!detail) throw new Error("Detail bounty tidak ditemukan dari response API.");
  return detail;
}

export function extractCreatedBountyId(response: CreateBountyResponse | null | undefined) {
  if (!response || typeof response !== "object") return null;

  const candidates = [
    response.data?.id,
    response.bounty?.id,
    response.id,
    response.bounty_id,
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>).bounty_id
      : undefined,
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>).uuid
      : undefined,
  ];

  const found = candidates.find(
    (value) =>
      (typeof value === "string" && value.trim()) || typeof value === "number"
  );

  return found === undefined || found === null ? null : String(found);
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
    return normalizeBountyList<AdminBountyRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function getAdminBountyDetail(id: number | string) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.get(`${env.ADMIN_BOUNTIES_PATH}/${safeId}`);
    return normalizeBountyDetail<AdminBountyRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function updateBountyStatus(id: number | string, status: BountyStatus) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.patch(
      `${env.ADMIN_BOUNTIES_PATH}/${safeId}/status`,
      { status }
    );

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function getSupplierBounties() {
  try {
    const { data } = await apiClient.get(env.SUPPLIER_BOUNTIES_PATH);
    return normalizeBountyList<SupplierBountyRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function getSupplierBountyDetail(id: number | string) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.get(`${env.SUPPLIER_BOUNTIES_PATH}/${safeId}`);
    return normalizeBountyDetail<SupplierBountyRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}