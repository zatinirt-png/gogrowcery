export const SUPPLIER_GUIDED_DRAFT_KEY = "gg_supplier_admin_onboarding_draft";

export const SUPPLIER_GUIDED_KTP_DB_NAME = "gg_supplier_guided_documents";
export const SUPPLIER_GUIDED_KTP_STORE_NAME = "documents";
export const SUPPLIER_GUIDED_KTP_KEY = "ktp_document";

export const supplierGuidedRoutes = {
  start: "/register/supplier/guided",
  step2: "/register/supplier/guided/step-2",
  step3: "/register/supplier/guided/step-3",
  step4: "/register/supplier/guided/step-4",
  step5: "/register/supplier/guided/step-5",
  complete: "/register/supplier/guided/complete",
} as const;

export type SupplierGuidedStoredDocument = {
  key: string;
  file: Blob;
  fileName: string;
  fileType: string;
  fileSize: number;
  updatedAt: string;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openSupplierGuidedDocumentDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("Browser storage tidak tersedia."));
      return;
    }

    const request = indexedDB.open(SUPPLIER_GUIDED_KTP_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SUPPLIER_GUIDED_KTP_STORE_NAME)) {
        db.createObjectStore(SUPPLIER_GUIDED_KTP_STORE_NAME, {
          keyPath: "key",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => {
      reject(request.error || new Error("Gagal membuka penyimpanan dokumen."));
    };
  });
}

export async function saveSupplierGuidedKtpDocument(file: File) {
  const db = await openSupplierGuidedDocumentDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      SUPPLIER_GUIDED_KTP_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(SUPPLIER_GUIDED_KTP_STORE_NAME);

    const payload: SupplierGuidedStoredDocument = {
      key: SUPPLIER_GUIDED_KTP_KEY,
      file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(payload);

    request.onerror = () => {
      reject(request.error || new Error("Gagal menyimpan foto KTP."));
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Gagal menyimpan foto KTP."));
    };
  });
}

export async function getSupplierGuidedKtpDocument() {
  const db = await openSupplierGuidedDocumentDb();

  return new Promise<SupplierGuidedStoredDocument | null>((resolve, reject) => {
    const transaction = db.transaction(
      SUPPLIER_GUIDED_KTP_STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(SUPPLIER_GUIDED_KTP_STORE_NAME);
    const request = store.get(SUPPLIER_GUIDED_KTP_KEY);

    request.onsuccess = () => {
      const result = request.result as SupplierGuidedStoredDocument | undefined;
      resolve(result || null);
    };

    request.onerror = () => {
      reject(request.error || new Error("Gagal membaca foto KTP."));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Gagal membaca foto KTP."));
    };
  });
}

export async function deleteSupplierGuidedKtpDocument() {
  const db = await openSupplierGuidedDocumentDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      SUPPLIER_GUIDED_KTP_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(SUPPLIER_GUIDED_KTP_STORE_NAME);
    const request = store.delete(SUPPLIER_GUIDED_KTP_KEY);

    request.onerror = () => {
      reject(request.error || new Error("Gagal menghapus foto KTP."));
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Gagal menghapus foto KTP."));
    };
  });
}

export function formatSupplierGuidedFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";

  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}