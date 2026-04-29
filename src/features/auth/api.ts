import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import type {
  AdminCreateSupplierPayload,
  LoginPayload,
  LoginResponse,
  MeResponse,
  PendingSupplierRecord,
  RegisterBuyerPayload,
  RegisterResponse,
  RegisterSupplierPayload,
  SupplierLandPayload,
  SupplierPayoutPayload,
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
  function findSupplierArray(source: unknown, depth = 0): PendingSupplierRecord[] {
    if (Array.isArray(source)) return source as PendingSupplierRecord[];

    if (!source || typeof source !== "object" || depth > 5) return [];

    const record = source as Record<string, unknown>;

    const preferredKeys = [
      "data",
      "suppliers",
      "supplier",
      "pending",
      "applications",
      "items",
      "results",
      "records",
      "users",
      "list",
    ];

    for (const key of preferredKeys) {
      if (!(key in record)) continue;

      const value = record[key];
      const found = findSupplierArray(value, depth + 1);

      if (found.length > 0 || Array.isArray(value)) return found;
    }

    return [];
  }

  return findSupplierArray(payload);
}

function normalizeSupplierRecord(payload: unknown): PendingSupplierRecord | null {
  if (!payload || typeof payload !== "object") return null;

  if (Array.isArray(payload)) {
    return payload[0] && typeof payload[0] === "object"
      ? (payload[0] as PendingSupplierRecord)
      : null;
  }

  const data = payload as Record<string, unknown>;

  const nestedData =
    data.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? (data.data as Record<string, unknown>)
      : undefined;

  const deeperData =
    nestedData?.data &&
    typeof nestedData.data === "object" &&
    !Array.isArray(nestedData.data)
      ? (nestedData.data as Record<string, unknown>)
      : undefined;

  const candidateObjects = [
    data.supplier,
    data.record,
    data.item,
    data.result,
    data.user,
    data.data,
    nestedData?.supplier,
    nestedData?.record,
    nestedData?.item,
    nestedData?.result,
    nestedData?.user,
    nestedData,
    deeperData?.supplier,
    deeperData?.record,
    deeperData?.item,
    deeperData?.result,
    deeperData,
    data,
  ];

  for (const candidate of candidateObjects) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as PendingSupplierRecord;
    }
  }

  return null;
}

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;

  if (typeof value === "string" && value.trim() === "") {
    formData.append(key, "");
    return;
  }

  formData.append(key, String(value));
}

function appendFileValue(formData: FormData, key: string, value: unknown) {
  if (!value) return;

  if (value instanceof File) {
    formData.append(key, value, value.name || "ktp_document");
    return;
  }

  if (value instanceof Blob) {
    formData.append(key, value, "ktp_document");
  }
}

function appendLandFields(
  formData: FormData,
  index: number,
  land: SupplierLandPayload
) {
  appendFormValue(formData, `lands[${index}][nama_lahan]`, land.nama_lahan);
  appendFormValue(formData, `lands[${index}][nama_pemilik]`, land.nama_pemilik);
  appendFormValue(formData, `lands[${index}][no_hp]`, land.no_hp);
  appendFormValue(formData, `lands[${index}][alamat_lahan]`, land.alamat_lahan);
  appendFormValue(formData, `lands[${index}][desa]`, land.desa);
  appendFormValue(formData, `lands[${index}][kecamatan]`, land.kecamatan);
  appendFormValue(formData, `lands[${index}][kabupaten]`, land.kabupaten);
  appendFormValue(formData, `lands[${index}][provinsi]`, land.provinsi);
  appendFormValue(formData, `lands[${index}][kepemilikan]`, land.kepemilikan);
  appendFormValue(
    formData,
    `lands[${index}][luas_lahan_m2]`,
    land.luas_lahan_m2
  );
  appendFormValue(formData, `lands[${index}][status_aktif]`, land.status_aktif);
}

function appendPayoutFields(formData: FormData, payout?: SupplierPayoutPayload) {
  if (!payout) return;

  appendFormValue(formData, "payout[payout_method]", payout.payout_method);

  appendFormValue(formData, "payout[bank_name]", payout.bank_name);
  appendFormValue(
    formData,
    "payout[bank_account_number]",
    payout.bank_account_number
  );
  appendFormValue(
    formData,
    "payout[bank_account_name]",
    payout.bank_account_name
  );

  appendFormValue(formData, "payout[ewallet_name]", payout.ewallet_name);
  appendFormValue(
    formData,
    "payout[ewallet_account_number]",
    payout.ewallet_account_number
  );
  appendFormValue(
    formData,
    "payout[ewallet_account_name]",
    payout.ewallet_account_name
  );
}

function buildRegisterSupplierFormData(payload: RegisterSupplierPayload) {
  const formData = new FormData();

  appendFormValue(formData, "name", payload.name);
  appendFormValue(formData, "username", payload.username);
  appendFormValue(formData, "password", payload.password);
  appendFormValue(
    formData,
    "password_confirmation",
    payload.password_confirmation
  );

  appendFormValue(formData, "email", payload.email ?? "");

  appendFormValue(formData, "nama_lengkap", payload.nama_lengkap);
  appendFormValue(formData, "no_ktp", payload.no_ktp);
  appendFormValue(formData, "tempat_lahir", payload.tempat_lahir);
  appendFormValue(formData, "tanggal_lahir", payload.tanggal_lahir);
  appendFormValue(formData, "jenis_kelamin", payload.jenis_kelamin);


  appendFormValue(formData, "no_hp", payload.no_hp);
  appendFormValue(formData, "alamat_domisili", payload.alamat_domisili);
  appendFormValue(formData, "desa", payload.desa);
  appendFormValue(formData, "kecamatan", payload.kecamatan);
  appendFormValue(formData, "kabupaten", payload.kabupaten);


  appendFileValue(formData, "ktp_document", payload.ktp_document);

  payload.lands?.forEach((land, index) => {
    appendLandFields(formData, index, land);
  });

  appendPayoutFields(formData, payload.payout);

  return formData;
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
    const formData = buildRegisterSupplierFormData(payload);

    const { data } = await apiClient.post<RegisterResponse>(
      env.AUTH_REGISTER_SUPPLIER_PATH,
      formData
    );

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function createAdminSupplier(payload: AdminCreateSupplierPayload) {
  try {
    const { data } = await apiClient.post<RegisterResponse>(
      env.ADMIN_SUPPLIERS_PATH,
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

export async function getAdminSuppliers() {
  const endpoints = [
    env.ADMIN_SUPPLIERS_PATH,
    `${env.ADMIN_SUPPLIERS_PATH}?status=all`,
    `${env.ADMIN_SUPPLIERS_PATH}?include=pending`,
  ];

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const { data } = await apiClient.get(endpoint);
      return normalizePendingSuppliers(data);
    } catch (error) {
      lastError = error;
    }
  }

  extractApiError(lastError);
}

export async function getAdminSupplierDetail(id: number | string) {
  const safeId = encodeURIComponent(String(id));

  const endpoints = [
    `${env.ADMIN_SUPPLIERS_PATH}/${safeId}`,
    `${env.ADMIN_SUPPLIERS_PATH}/${safeId}/detail`,
    `${env.ADMIN_SUPPLIERS_PATH}?id=${safeId}`,
    `${env.ADMIN_SUPPLIERS_PATH}?supplier_id=${safeId}`,
  ];

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const { data } = await apiClient.get(endpoint);
      const normalized = normalizeSupplierRecord(data);

      if (normalized) return normalized;
    } catch (error) {
      lastError = error;
    }
  }

  extractApiError(lastError);
}

export async function approveSupplier(id: number | string) {
  try {
    const { data } = await apiClient.patch(
      resolveTemplatePath(env.ADMIN_SUPPLIER_APPROVE_PATH_TEMPLATE, id)
    );

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function rejectSupplier(
  id: number | string,
  reason = "Ditolak oleh admin setelah review data supplier."
) {
  const path = resolveTemplatePath(env.ADMIN_SUPPLIER_REJECT_PATH_TEMPLATE, id);
  const payload = {
    rejection_reason: reason,
    reason,
  };

  try {
    const { data } = await apiClient.patch(path, payload);

    return data;
  } catch (firstError) {
    if (axios.isAxiosError(firstError)) {
      try {
        const { data } = await apiClient.patch(path);

        return data;
      } catch (secondError) {
        extractApiError(secondError);
      }
    }

    extractApiError(firstError);
  }
}
