import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  PendingSupplierRecord,
  RegisterBuyerPayload,
  RegisterResponse,
  RegisterSupplierPayload,
} from "./types";

function extractApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan pada server.";
    throw new Error(message);
  }

  throw new Error("Terjadi kesalahan yang tidak diketahui.");
}

function resolveTemplatePath(template: string, id: number | string) {
  return template.replace("{id}", String(id));
}

function normalizePendingSuppliers(payload: unknown): PendingSupplierRecord[] {
  if (Array.isArray(payload)) return payload as PendingSupplierRecord[];

  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const nestedData =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : undefined;

  const candidateArrays = [
    data.data,
    data.suppliers,
    data.pending,
    data.items,
    data.results,
    data.records,
    nestedData?.suppliers,
    nestedData?.pending,
    nestedData?.items,
    nestedData?.results,
    nestedData?.records,
  ];

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate)) return candidate as PendingSupplierRecord[];
  }

  return [];
}

export async function login(payload: LoginPayload) {
  try {
    const { data } = await apiClient.post<LoginResponse>(
      env.AUTH_LOGIN_PATH,
      payload
    );
    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function registerBuyer(payload: RegisterBuyerPayload) {
  try {
    const { data } = await apiClient.post<RegisterResponse>(
      env.AUTH_REGISTER_BUYER_PATH,
      payload
    );
    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function registerSupplier(payload: RegisterSupplierPayload) {
  try {
    const { data } = await apiClient.post<RegisterResponse>(
      env.AUTH_REGISTER_SUPPLIER_PATH,
      payload
    );
    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function getMe() {
  try {
    const { data } = await apiClient.get<MeResponse>(env.AUTH_ME_PATH);
    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function logout() {
  try {
    const { data } = await apiClient.post<{ message: string }>(
      env.AUTH_LOGOUT_PATH
    );
    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function getPendingSuppliers() {
  try {
    const { data } = await apiClient.get(env.ADMIN_SUPPLIERS_PENDING_PATH);
    return normalizePendingSuppliers(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function approveSupplier(id: number | string) {
  try {
    const { data } = await apiClient.patch(
      resolveTemplatePath(env.ADMIN_SUPPLIER_APPROVE_PATH_TEMPLATE, id),
      {}
    );
    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function rejectSupplier(
  id: number | string,
  rejectionReason = "Rejected by admin"
) {
  try {
    const { data } = await apiClient.patch(
      resolveTemplatePath(env.ADMIN_SUPPLIER_REJECT_PATH_TEMPLATE, id),
      {
        rejection_reason: rejectionReason,
      }
    );
    return data;
  } catch (error) {
    extractApiError(error);
  }
}