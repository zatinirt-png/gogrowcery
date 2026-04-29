"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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

  const samePage =
    targetUrl.pathname === currentUrl.pathname &&
    targetUrl.search === currentUrl.search &&
    targetUrl.hash === currentUrl.hash;

  return !samePage;
}

export default function GlobalLoadingOverlay() {
  const pathname = usePathname();
  const [apiLoading, setApiLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const routeTimeoutRef = useRef<number | null>(null);
  const visibleTimeoutRef = useRef<number | null>(null);

  const active = apiLoading || routeLoading;

  useEffect(() => {
    const unsubscribe = subscribeGlobalLoading((detail) => {
      setApiLoading(detail.active);
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
    if (visibleTimeoutRef.current) {
      window.clearTimeout(visibleTimeoutRef.current);
    }

    if (!active) {
      setVisible(false);
      return;
    }

    visibleTimeoutRef.current = window.setTimeout(() => {
      setVisible(true);
    }, 120);

    return () => {
      if (visibleTimeoutRef.current) {
        window.clearTimeout(visibleTimeoutRef.current);
      }
    };
  }, [active]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"
    >
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/60 border-t-primary shadow-lg" />
      <span className="sr-only">Loading</span>
    </div>
  );
}