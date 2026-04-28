type GlobalLoadingDetail = {
  active: boolean;
  activeCount: number;
  message?: string;
};

const GLOBAL_LOADING_EVENT = "gogrowcery:global-loading";

let activeCount = 0;
let currentMessage = "Memuat data...";

function emitGlobalLoading() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<GlobalLoadingDetail>(GLOBAL_LOADING_EVENT, {
      detail: {
        active: activeCount > 0,
        activeCount,
        message: currentMessage,
      },
    })
  );
}

export function startGlobalLoading(message = "Memuat data...") {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  activeCount += 1;
  currentMessage = message;
  emitGlobalLoading();

  let finished = false;

  return () => {
    if (finished) return;
    finished = true;

    activeCount = Math.max(0, activeCount - 1);

    if (activeCount === 0) {
      currentMessage = "Memuat data...";
    }

    emitGlobalLoading();
  };
}

export function stopAllGlobalLoading() {
  if (typeof window === "undefined") return;

  activeCount = 0;
  currentMessage = "Memuat data...";
  emitGlobalLoading();
}

export function subscribeGlobalLoading(
  callback: (detail: GlobalLoadingDetail) => void
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<GlobalLoadingDetail>;
    callback(customEvent.detail);
  };

  window.addEventListener(GLOBAL_LOADING_EVENT, handler);

  return () => {
    window.removeEventListener(GLOBAL_LOADING_EVENT, handler);
  };
}