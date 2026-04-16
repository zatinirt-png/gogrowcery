export type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  role: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
  token: string;
};

export type RegisterBuyerPayload = {
  name: string;
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
  full_name: string;
  phone?: string;
};

export type SupplierLandPayload = {
  nama_lahan?: string;
  nama_pemilik?: string;
  no_hp?: string;
  alamat_lahan?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  kepemilikan?: string;
  luas_lahan_m2?: number;
  status_aktif?: string;
};

export type SupplierPayoutPayload = {
  payout_method?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
};

export type RegisterSupplierPayload = {
  name: string;
  username?: string;
  email?: string | null;
  password: string;
  password_confirmation?: string;

  nama_lengkap?: string;
  no_ktp?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  status_perkawinan?: string;
  no_hp?: string;
  alamat_domisili?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  bahasa_komunikasi?: string[];

  lands?: SupplierLandPayload[];
  payout?: SupplierPayoutPayload;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type PendingSupplierRecord = {
  id: number | string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  nama_lengkap?: string | null;
  no_hp?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};