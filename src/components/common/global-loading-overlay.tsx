"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Sprout } from "lucide-react";
import { subscribeGlobalLoading } from "@/lib/global-loading";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function getAnchorFromEvent(event: MouseEvent) {
  const target = event.target;

  if (!(target instanceof Element)) return null;

  return target.closest("a[href]") as HTMLAnchorElement | null;
}

function shouldShowRouteLoading(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");

  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:")) return false;
  if (href.startsWith("tel:")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const targetUrl = new URL(anchor.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (targetUrl.origin !== currentUrl.origin) return false;

  const samePath =
    targetUrl.pathname === currentUrl.pathname &&
    targetUrl.search === currentUrl.search;

  if (samePath && targetUrl.hash) return false;

  return !samePath;
}

export default function GlobalLoadingOverlay() {
  const pathname = usePathname();
  const [apiLoading, setApiLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [message, setMessage] = useState("Memuat data...");
  const [delayedVisible, setDelayedVisible] = useState(false);
  const routeTimeoutRef = useRef<number | null>(null);

  const active = apiLoading || routeLoading;

  const displayMessage = useMemo(() => {
    if (routeLoading) return "Membuka halaman...";
    return message || "Memuat data...";
  }, [message, routeLoading]);

  useEffect(() => {
    const unsubscribe = subscribeGlobalLoading((detail) => {
      setApiLoading(detail.active);
      setMessage(detail.message || "Memuat data...");
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (isModifiedClick(event)) return;

      const anchor = getAnchorFromEvent(event);

      if (!anchor) return;
      if (!shouldShowRouteLoading(anchor)) return;

      setRouteLoading(true);

      if (routeTimeoutRef.current) {
        window.clearTimeout(routeTimeoutRef.current);
      }

      routeTimeoutRef.current = window.setTimeout(() => {
        setRouteLoading(false);
      }, 9000);
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);

      if (routeTimeoutRef.current) {
        window.clearTimeout(routeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRouteLoading(false);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  useEffect(() => {
    if (!active) {
      setDelayedVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setDelayedVisible(true);
    }, 140);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [active]);

  if (!delayedVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-white/20 bg-surface-container-lowest p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <div className="relative">
            <Sprout className="h-7 w-7" />
            <Loader2 className="absolute -right-3 -top-3 h-5 w-5 animate-spin text-primary" />
          </div>
        </div>

        <h2 className="mt-5 font-headline text-xl font-extrabold text-on-surface">
          Sedang memproses
        </h2>

        <p className="mt-2 text-sm font-semibold text-on-surface-variant">
          {displayMessage}
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>

        <p className="mt-4 text-xs leading-5 text-on-surface-variant">
          Mohon tunggu sebentar. Sistem sedang mengambil atau mengirim data.
        </p>
      </div>
    </div>
  );
}