import type {
  BountyItemRecord,
  BountyRecord,
} from "@/features/bounty/types";

export function getNestedValue(source: unknown, path: string) {
  const parts = path.split(".");
  let current = source;

  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function firstString(source: unknown, paths: string[], fallback = "-") {
  for (const path of paths) {
    const value = getNestedValue(source, path);

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

export function titleCaseStatus(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Available";

  return normalized
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function resolveBountyStatus(record: BountyRecord) {
  return titleCaseStatus(
    firstString(record, ["status", "publication_status", "approval_status"], "Available")
  );
}

export function getStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (["published", "available", "open", "active"].includes(normalized)) {
    return "bg-primary/10 text-primary";
  }

  if (["draft", "pending"].includes(normalized)) {
    return "bg-secondary-container text-on-secondary-container";
  }

  if (["closed", "completed", "done"].includes(normalized)) {
    return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return "bg-error-container text-on-error-container";
  }

  return "bg-surface-container-high text-on-surface";
}

export function getBountyItems(record: BountyRecord) {
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.bounty_items)) return record.bounty_items;

  const dataItems = getNestedValue(record, "data.items");
  if (Array.isArray(dataItems)) return dataItems as BountyItemRecord[];

  const dataBountyItems = getNestedValue(record, "data.bounty_items");
  if (Array.isArray(dataBountyItems)) return dataBountyItems as BountyItemRecord[];

  return [];
}

export function getBountyId(record: BountyRecord, index = 0) {
  return firstString(record, ["id", "uuid", "bounty_id", "data.id"], `bounty-${index + 1}`);
}

export function getBountyCode(record: BountyRecord, index = 0) {
  return firstString(
    record,
    ["code", "bounty_code", "reference", "ref_code", "number", "id", "data.id"],
    `BNT-${String(index + 1).padStart(3, "0")}`
  );
}

export function getBountyTitle(record: BountyRecord) {
  return firstString(record, ["title", "name", "data.title"], "Untitled Bounty");
}

export function getBountyClient(record: BountyRecord) {
  return firstString(
    record,
    ["client_name", "client.name", "buyer.name", "customer.name", "data.client_name"],
    "Client tidak tersedia"
  );
}

export function getBountyDescription(record: BountyRecord) {
  return firstString(
    record,
    ["description", "notes", "data.description"],
    "Tidak ada deskripsi bounty."
  );
}

export function getBountyDeadline(record: BountyRecord) {
  return firstString(
    record,
    ["deadline_at", "deadline", "deadlineAt", "data.deadline_at"],
    "-"
  );
}

export function getBountyCreatedBy(record: BountyRecord) {
  return firstString(
    record,
    ["created_by.name", "creator.name", "admin.name", "user.name", "created_by"],
    "-"
  );
}

export function getBountyCreatedAt(record: BountyRecord) {
  return firstString(record, ["created_at", "createdAt", "data.created_at"], "-");
}

export function getItemName(item: BountyItemRecord, index: number) {
  return firstString(item, ["item_name", "name"], `Item ${index + 1}`);
}

export function getItemQty(item: BountyItemRecord) {
  const quantity =
    item.target_quantity !== null && item.target_quantity !== undefined
      ? String(item.target_quantity)
      : item.quantity !== null && item.quantity !== undefined
        ? String(item.quantity)
        : item.qty !== null && item.qty !== undefined
          ? String(item.qty)
          : "-";

  const unit =
    typeof item.unit === "string" && item.unit.trim() ? item.unit.trim() : "";

  return `${quantity}${unit ? ` ${unit}` : ""}`.trim();
}

export function formatDateLabel(value?: string | null) {
  if (!value || value === "-") return "-";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getDeadlineDate(value: string) {
  if (!value || value === "-") return null;

  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getRemainingLabel(value: string, status: string) {
  const normalizedStatus = status.toLowerCase();

  if (!["published", "available", "open", "active"].includes(normalizedStatus)) {
    return normalizedStatus === "draft" ? "Belum dipublish" : "Tidak aktif";
  }

  const deadline = getDeadlineDate(value);
  if (!deadline) return "Deadline tidak valid";

  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return "Deadline lewat";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} jam lagi`;

  return `${Math.ceil(diffHours / 24)} hari lagi`;
}

export function isUrgentBounty(record: BountyRecord) {
  const status = resolveBountyStatus(record).toLowerCase();
  if (!["published", "available", "open", "active"].includes(status)) return false;

  const deadline = getDeadlineDate(getBountyDeadline(record));
  if (!deadline) return false;

  const diffDays = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= 3;
}