import axios from "axios";
import { notifyBountyDirectoryChanged } from "@/features/bounty/bounty-directory-sync";
import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import type {
  AdminBidRecord,
  AdminBountyRecord,
  CreateBountyPayload,
  CreateBountyResponse,
  SupplierBidRecord,
  SupplierBountyRecord,
  SupplierBidPayload,
  UpdateBountyPayload,
  UpdateBountyResponse,
} from "@/features/bounty/types";

export type BountyStatus = "draft" | "published" | "closed" | "cancelled" | string;

const SUPPLIER_BIDS_PATH =
  process.env.NEXT_PUBLIC_SUPPLIER_BIDS_PATH || "/api/supplier/bids";

const ADMIN_BOUNTY_SNAPSHOT_KEY = "gogrowcery:admin-bounty-directory-snapshots";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAdminBountySnapshots() {
  if (!canUseBrowserStorage()) return [] as AdminBountyRecord[];

  try {
    const raw = window.localStorage.getItem(ADMIN_BOUNTY_SNAPSHOT_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminBountyRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAdminBountySnapshots(records: AdminBountyRecord[]) {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.setItem(ADMIN_BOUNTY_SNAPSHOT_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage failures.
  }
}

function upsertAdminBountySnapshot(record: AdminBountyRecord) {
  if (!canUseBrowserStorage()) return;

  const recordId =
    firstApiString(record, ["id", "uuid", "bounty_id", "data.id", "data.uuid"]) ||
    "";

  if (!recordId) return;

  const current = readAdminBountySnapshots();
  const next = new Map<string, AdminBountyRecord>();

  current.forEach((item, index) => {
    const key =
      firstApiString(item, ["id", "uuid", "bounty_id", "data.id", "data.uuid"]) ||
      `snapshot-${index}`;

    next.set(key, item);
  });

  const existing = next.get(recordId);
  next.set(recordId, existing ? { ...existing, ...record } : record);

  writeAdminBountySnapshots(Array.from(next.values()));
}

function buildAdminBountySnapshotFromCreate(
  payload: CreateBountyPayload,
  response: CreateBountyResponse | null | undefined
): AdminBountyRecord | null {
  const createdId = extractCreatedBountyId(response);
  if (!createdId) return null;

  let responseRecord: AdminBountyRecord = {};

  try {
    responseRecord = normalizeBountyDetail<AdminBountyRecord>(response);
  } catch {
    responseRecord = {};
  }

  const now = new Date().toISOString();

  return {
    ...responseRecord,
    id: firstApiString(responseRecord, ["id", "bounty_id", "uuid"], createdId),
    client_name:
      firstApiString(responseRecord, ["client_name", "data.client_name"], "") ||
      payload.client_name,
    title:
      firstApiString(responseRecord, ["title", "name", "data.title"], "") ||
      payload.title,
    description:
      firstApiString(responseRecord, ["description", "notes", "data.description"], "") ||
      payload.description ||
      "",
    deadline_at:
      firstApiString(responseRecord, ["deadline_at", "deadline", "data.deadline_at"], "") ||
      payload.deadline_at,
    status:
      firstApiString(
        responseRecord,
        ["status", "publication_status", "approval_status", "data.status"],
        ""
      ) || "draft",
    items:
      Array.isArray(responseRecord.items) && responseRecord.items.length
        ? responseRecord.items
        : payload.items,
    bounty_items:
      Array.isArray(responseRecord.bounty_items) && responseRecord.bounty_items.length
        ? responseRecord.bounty_items
        : payload.items,
    created_at:
      firstApiString(responseRecord, ["created_at", "createdAt", "data.created_at"], "") ||
      now,
    updated_at:
      firstApiString(responseRecord, ["updated_at", "updatedAt", "data.updated_at"], "") ||
      now,
    total_bids: 0,
    bids_count: 0,
    bid_count: 0,
  } as AdminBountyRecord;
}

function buildAdminBountySnapshotFromUpdate(
  id: number | string,
  payload: UpdateBountyPayload | AdminBountyUpdatePayload,
  patch: Partial<AdminBountyRecord> = {}
): AdminBountyRecord {
  const now = new Date().toISOString();

  return {
    id,
    client_name: payload.client_name,
    title: payload.title,
    description: payload.description || "",
    deadline_at: payload.deadline_at,
    items: payload.items,
    bounty_items: payload.items,
    updated_at: now,
    ...patch,
  } as AdminBountyRecord;
}

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
  const directKeys = [
    "data",
    "bounties",
    "bids",
    "items",
    "results",
    "records",
    "list",
    "rows",
  ];

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
  const directKeys = ["data", "bounty", "bid", "item", "record", "result"];

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

function getNestedApiValue(source: unknown, path: string) {
  const parts = path.split(".");
  let current = source;

  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function firstApiString(source: unknown, paths: string[], fallback = "") {
  for (const path of paths) {
    const value = getNestedApiValue(source, path);

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

function getAdminBountyMergeKey(record: AdminBountyRecord, index: number) {
  return (
    firstApiString(record, [
      "id",
      "uuid",
      "bounty_id",
      "data.id",
      "data.uuid",
      "data.bounty_id",
    ]) ||
    firstApiString(record, [
      "code",
      "bounty_code",
      "reference",
      "ref_code",
      "number",
      "data.code",
      "data.bounty_code",
    ]) ||
    `fallback-${index}`
  );
}

function mergeAdminBountyRecords(groups: AdminBountyRecord[][]) {
  const merged = new Map<string, AdminBountyRecord>();

  groups.forEach((records) => {
    records.forEach((record, index) => {
      const key = getAdminBountyMergeKey(record, index);
      const existing = merged.get(key);

      merged.set(key, existing ? { ...existing, ...record } : record);
    });
  });

  return Array.from(merged.values());
}

function getAdminBountyRecordId(record: AdminBountyRecord) {
  return firstApiString(record, [
    "id",
    "uuid",
    "bounty_id",
    "data.id",
    "data.uuid",
    "data.bounty_id",
  ]);
}

function getNoCacheConfig(params?: Record<string, string | number>) {
  return {
    params: {
      ...(params ?? {}),
      _live: Date.now(),
    },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    skipGlobalLoading: true,
    __skipGlobalLoading: true,
  };
}

function getApiDateTimeValue(record: AdminBountyRecord) {
  const raw = firstApiString(
    record,
    ["created_at", "createdAt", "data.created_at", "updated_at", "updatedAt", "data.updated_at"],
    ""
  );

  if (!raw) return 0;

  const date = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortAdminBountyRecords(records: AdminBountyRecord[]) {
  return [...records].sort((a, b) => getApiDateTimeValue(b) - getApiDateTimeValue(a));
}

async function hydrateAdminBountyRecord(record: AdminBountyRecord) {
  const id = getAdminBountyRecordId(record);

  if (!id) return record;

  const [detailResult, bidsResult] = await Promise.allSettled([
    apiClient.get(`${env.ADMIN_BOUNTIES_PATH}/${encodeURIComponent(id)}`, getNoCacheConfig()),
    apiClient.get(
      `${env.ADMIN_BOUNTIES_PATH}/${encodeURIComponent(id)}/bids`,
      getNoCacheConfig()
    ),
  ]);

  let nextRecord: AdminBountyRecord = { ...record };

  if (detailResult.status === "fulfilled") {
    try {
      const detail = normalizeBountyDetail<AdminBountyRecord>(detailResult.value.data);
      nextRecord = {
        ...nextRecord,
        ...detail,
      };
    } catch {
      // Keep list record if detail payload shape changes.
    }
  }

  if (bidsResult.status === "fulfilled") {
    const bids = normalizeBountyList<AdminBidRecord>(bidsResult.value.data);

    nextRecord = {
      ...nextRecord,
      bids,
      total_bids: bids.length,
      bids_count: bids.length,
      bid_count: bids.length,
    } as AdminBountyRecord;
  }

  return nextRecord;
}

function findFirstIdValue(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstIdValue(item);
      if (found) return found;
    }

    return null;
  }

  const record = value as Record<string, unknown>;

  const directCandidates = [
    record.id,
    record.bounty_id,
    record.uuid,
    record.bountyId,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const preferredNestedKeys = ["data", "bounty", "record", "result"];

  for (const key of preferredNestedKeys) {
    const found = findFirstIdValue(record[key]);
    if (found) return found;
  }

  return null;
}

export function extractCreatedBountyId(
  response: CreateBountyResponse | null | undefined
) {
  return findFirstIdValue(response);
}

export async function createBounty(payload: CreateBountyPayload) {
  try {
    const { data } = await apiClient.post<CreateBountyResponse>(
      env.ADMIN_BOUNTIES_PATH,
      payload
    );

    const snapshot = buildAdminBountySnapshotFromCreate(payload, data);
    if (snapshot) {
      upsertAdminBountySnapshot(snapshot);
    }

    notifyBountyDirectoryChanged("admin:create-bounty");

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function getAdminBounties() {
  try {
    const statusQueries = ["draft", "published", "closed", "cancelled"];

    const requests = [
      apiClient.get(env.ADMIN_BOUNTIES_PATH, getNoCacheConfig()),
      ...statusQueries.map((status) =>
        apiClient.get(env.ADMIN_BOUNTIES_PATH, getNoCacheConfig({ status }))
      ),
    ];

    const results = await Promise.allSettled(requests);

    const successfulGroups: AdminBountyRecord[][] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        successfulGroups.push(
          normalizeBountyList<AdminBountyRecord>(result.value.data)
        );
      }
    }

    const localSnapshots = readAdminBountySnapshots();

    if (!successfulGroups.length && !localSnapshots.length) {
      const firstRejected = results.find(
        (result) => result.status === "rejected"
      );

      if (firstRejected?.status === "rejected") {
        extractApiError(firstRejected.reason);
      }

      return [];
    }

    const mergedRecords = sortAdminBountyRecords(
      mergeAdminBountyRecords([...successfulGroups, localSnapshots])
    );

    const hydratedResults = await Promise.allSettled(
      mergedRecords.map((record) => hydrateAdminBountyRecord(record))
    );

    const hydratedRecords = hydratedResults.map((result, index) => {
      if (result.status === "fulfilled") return result.value;
      return mergedRecords[index];
    });

    return sortAdminBountyRecords(hydratedRecords);
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
export async function getAdminBountyBids(id: number | string) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.get(
      `${env.ADMIN_BOUNTIES_PATH}/${safeId}/bids`
    );

    return normalizeBountyList<AdminBidRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function getAdminBountyBidDetail(
  bountyId: number | string,
  bidId: number | string
) {
  try {
    const safeBountyId = encodeURIComponent(String(bountyId));
    const safeBidId = encodeURIComponent(String(bidId));

    const { data } = await apiClient.get(
      `${env.ADMIN_BOUNTIES_PATH}/${safeBountyId}/bids/${safeBidId}`
    );

    return normalizeBountyDetail<Record<string, unknown>>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export type AdminBidItemApprovalStatus = "approved" | "rejected";

export type AdminBidItemApprovalPayload = {
  status: AdminBidItemApprovalStatus;
  catatan?: string;
  proof_photo?: File | null;
};



export async function approveAdminBountyBidItem(
  bountyId: number | string,
  bidId: number | string,
  itemId: number | string,
  payload: AdminBidItemApprovalPayload
) {
  try {
    const safeBountyId = encodeURIComponent(String(bountyId));
    const safeBidId = encodeURIComponent(String(bidId));
    const safeItemId = encodeURIComponent(String(itemId));

    const formData = new FormData();
    formData.append("status", payload.status);

    if (payload.catatan?.trim()) {
      formData.append("catatan", payload.catatan.trim());
    }

    if (payload.proof_photo) {
      formData.append("proof_photo", payload.proof_photo);
    }

    const { data } = await apiClient.post(
      `${env.ADMIN_BOUNTIES_PATH}/${safeBountyId}/bids/${safeBidId}/items/${safeItemId}/approve`,
      formData
    );

    notifyBountyDirectoryChanged("admin:approve-bid-item");

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export type AdminBountyUpdatePayload = {
  client_name: string;
  title: string;
  description: string;
  deadline_at: string;
  items: Array<{
    item_name: string;
    target_quantity: number;
    unit: string;
    notes?: string;
  }>;
};

export async function updateAdminBountyDraft(
  id: number | string,
  payload: AdminBountyUpdatePayload
) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.put(
      `${env.ADMIN_BOUNTIES_PATH}/${safeId}`,
      payload
    );

    upsertAdminBountySnapshot(
      buildAdminBountySnapshotFromUpdate(id, payload, {
        status: "draft",
      })
    );

    notifyBountyDirectoryChanged("admin:update-bounty-draft");

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function updateBounty(
  id: number | string,
  payload: UpdateBountyPayload
) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.put<UpdateBountyResponse>(
      `${env.ADMIN_BOUNTIES_PATH}/${safeId}`,
      payload
    );

    upsertAdminBountySnapshot(buildAdminBountySnapshotFromUpdate(id, payload));

    notifyBountyDirectoryChanged("admin:update-bounty");

    return data;
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

    const currentSnapshot = readAdminBountySnapshots().find((record) => {
      const recordId = firstApiString(record, ["id", "uuid", "bounty_id", "data.id"], "");
      return String(recordId) === String(id);
    });

    upsertAdminBountySnapshot({
      ...(currentSnapshot ?? {}),
      id,
      status,
      updated_at: new Date().toISOString(),
    } as AdminBountyRecord);

    notifyBountyDirectoryChanged(`admin:update-bounty-status:${status}`);

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function extendBountyDeadline(
  id: number | string,
  newDeadline: string
) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.patch(
      `${env.ADMIN_BOUNTIES_PATH}/${safeId}/extend-deadline`,
      {
        new_deadline: newDeadline,
      }
    );

    notifyBountyDirectoryChanged("admin:extend-bounty-deadline");

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

export async function getSupplierBids() {
  try {
    const { data } = await apiClient.get(SUPPLIER_BIDS_PATH);
    return normalizeBountyList<SupplierBidRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function getSupplierBountyBid(id: number | string) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.get(`${env.SUPPLIER_BOUNTIES_PATH}/${safeId}/bid`);
    return normalizeBountyDetail<SupplierBidRecord>(data);
  } catch (error) {
    extractApiError(error);
  }
}

export async function submitSupplierBountyBid(
  id: number | string,
  payload: SupplierBidPayload
) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.post(
      `${env.SUPPLIER_BOUNTIES_PATH}/${safeId}/bid`,
      payload
    );

    notifyBountyDirectoryChanged("supplier:submit-bid");

    return data;
  } catch (error) {
    extractApiError(error);
  }
}

export async function withdrawSupplierBountyBid(id: number | string) {
  try {
    const safeId = encodeURIComponent(String(id));
    const { data } = await apiClient.delete(
      `${env.SUPPLIER_BOUNTIES_PATH}/${safeId}/bid`
    );

    notifyBountyDirectoryChanged("supplier:withdraw-bid");

    return data;
  } catch (error) {
    extractApiError(error);
  }
}