export type BountyItemPayload = {
  item_name: string;
  target_quantity: number;
  unit: string;
  notes?: string;
};

export type CreateBountyPayload = {
  client_name: string;
  title: string;
  description?: string;
  deadline_at: string;
  items: BountyItemPayload[];
};

export type CreateBountyResponse = {
  message?: string;
  data?: {
    id?: number | string;
    [key: string]: unknown;
  };
  bounty?: {
    id?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type BountyItemRecord = {
  id?: number | string;
  item_name?: string | null;
  name?: string | null;
  target_quantity?: number | string | null;
  quantity?: number | string | null;
  qty?: number | string | null;
  unit?: string | null;
  notes?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

export type BountyRecord = {
  id?: number | string;
  code?: string | null;
  bounty_code?: string | null;
  client_name?: string | null;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  deadline_at?: string | null;
  deadline?: string | null;
  status?: string | null;
  approval_status?: string | null;
  publication_status?: string | null;
  items?: BountyItemRecord[];
  bounty_items?: BountyItemRecord[];
  created_by?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type AdminBountyRecord = BountyRecord;
export type SupplierBountyRecord = BountyRecord;
export type SupplierBountyItem = BountyItemRecord;
