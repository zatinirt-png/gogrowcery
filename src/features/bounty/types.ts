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

export type UpdateBountyPayload = CreateBountyPayload;

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

export type UpdateBountyResponse = CreateBountyResponse;

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
  original_deadline_at?: string | null;
  previous_deadline_at?: string | null;
  extended_deadline_at?: string | null;
  status?: string | null;
  approval_status?: string | null;
  publication_status?: string | null;
  items?: BountyItemRecord[];
  bounty_items?: BountyItemRecord[];
  bid?: SupplierBidRecord | null;
  my_bid?: SupplierBidRecord | null;
  supplier_bid?: SupplierBidRecord | null;
  has_bid?: boolean | number | string | null;
  is_bid_submitted?: boolean | number | string | null;
  created_by?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type SupplierBidItemRecord = {
  id?: number | string;
  bounty_item_id?: number | string | null;
  bounty_item?: BountyItemRecord | null;
  grade?: string | null;
  estimasi_harga?: number | string | null;
  estimated_price?: number | string | null;
  price?: number | string | null;
  estimasi_kuantitas?: number | string | null;
  estimated_quantity?: number | string | null;
  quantity?: number | string | null;
  catatan?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

export type SupplierBidRecord = {
  id?: number | string;
  bounty_id?: number | string | null;
  bountyId?: number | string | null;
  bounty?: BountyRecord | null;
  status?: string | null;
  notes?: string | null;
  items?: SupplierBidItemRecord[];
  bid_items?: SupplierBidItemRecord[];
  created_at?: string | null;
  updated_at?: string | null;
  submitted_at?: string | null;
  [key: string]: unknown;
};
export type AdminBidRecord = SupplierBidRecord & {
  supplier_id?: number | string | null;
  supplierId?: number | string | null;
  supplier_name?: string | null;
  supplier?: {
    id?: number | string;
    name?: string | null;
    business_name?: string | null;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    [key: string]: unknown;
  } | null;
};

export type SupplierBidItemPayload = {
  bounty_item_id: number | string;
  grade: string;
  estimasi_harga: number;
  estimasi_kuantitas: number;
  catatan?: string;
};

export type SupplierBidPayload = {
  notes?: string;
  items: SupplierBidItemPayload[];
};



export type AdminBountyRecord = BountyRecord;
export type SupplierBountyRecord = BountyRecord;
export type SupplierBountyItem = BountyItemRecord;