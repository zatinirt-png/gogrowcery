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

export type SupplierBountyItem = {
  id?: number | string;
  item_name?: string | null;
  target_quantity?: number | string | null;
  unit?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

export type SupplierBountyRecord = {
  id?: number | string;
  code?: string | null;
  client_name?: string | null;
  title?: string | null;
  description?: string | null;
  deadline_at?: string | null;
  status?: string | null;
  items?: SupplierBountyItem[];
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};