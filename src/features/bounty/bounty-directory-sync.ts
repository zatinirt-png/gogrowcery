export type BountyDirectorySyncPayload = {
  source: string;
  at: number;
};

export const BOUNTY_DIRECTORY_SYNC_EVENT = "gogrowcery:bounty-directory-sync";
const BOUNTY_DIRECTORY_SYNC_STORAGE_KEY = "gogrowcery:bounty-directory-sync-ping";

export function notifyBountyDirectoryChanged(source = "unknown") {
  if (typeof window === "undefined") return;

  const payload: BountyDirectorySyncPayload = {
    source,
    at: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent<BountyDirectorySyncPayload>(BOUNTY_DIRECTORY_SYNC_EVENT, {
      detail: payload,
    })
  );

  try {
    window.localStorage.setItem(
      BOUNTY_DIRECTORY_SYNC_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // localStorage can fail in private mode. Local event above is enough.
  }
}

export function subscribeBountyDirectorySync(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = () => {
    callback();
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === BOUNTY_DIRECTORY_SYNC_STORAGE_KEY) {
      callback();
    }
  };

  const handleFocus = () => {
    callback();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      callback();
    }
  };

  window.addEventListener(BOUNTY_DIRECTORY_SYNC_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);
  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.removeEventListener(BOUNTY_DIRECTORY_SYNC_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}