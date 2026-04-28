"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  ClipboardList,
  HandCoins,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareQuote,
  Settings,
  Sprout,
  Star,
  UserCircle2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
  children?: NavItem[];
};

type UniversalAppShellProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  role?: string | null;
  user?: SidebarUser | null;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  showHeader?: boolean;
  publicCtaHref?: string;
  publicCtaLabel?: string;
};

const globalNav: NavItem[] = [
  {
    label: "About Us",
    href: "/#about-us",
    icon: Building2,
    match: (pathname) => pathname === "/",
  },
  {
    label: "Strategic Partner",
    href: "/#strategic-partner",
    icon: Users,
  },
  {
    label: "Testimoni",
    href: "/#testimoni",
    icon: MessageSquareQuote,
  },
  {
    label: "Guide",
    href: "/#guide",
    icon: HelpCircle,
  },
  {
    label: "FAQ",
    href: "/#faq",
    icon: Star,
  },
];

function getRoleNav(role?: string | null): NavItem[] {
  const normalized = (role || "").toLowerCase();

  if (normalized === "admin") {
    return [
      {
        label: "Dashboard Admin",
        href: "/admin",
        icon: LayoutDashboard,
        match: (pathname) => pathname === "/admin",
      },
      {
        label: "Supplier",
        href: "/admin/suppliers",
        icon: Users,
        match: (pathname) => pathname.startsWith("/admin/suppliers"),
        children: [
          {
            label: "Supplier Directory",
            href: "/admin/suppliers",
            icon: Users,
            match: (pathname) => pathname === "/admin/suppliers",
          },
          {
            label: "Pending Applications",
            href: "/admin/suppliers/pending",
            icon: ClipboardList,
            match: (pathname) => pathname.startsWith("/admin/suppliers/pending"),
          },
          {
            label: "Add Supplier",
            href: "/admin/suppliers/add",
            icon: UserPlus,
            match: (pathname) => pathname === "/admin/suppliers/add",
          },
        ],
      },
      {
        label: "Bounty",
        href: "/admin/bounties",
        icon: HandCoins,
        match: (pathname) => pathname.startsWith("/admin/bounties"),
      },
    ];
  }

  if (normalized === "supplier" || normalized === "farmer") {
    return [
      {
        label: "Dashboard Supplier",
        href: "/supplier",
        icon: LayoutDashboard,
        match: (pathname) => pathname === "/supplier",
      },
      {
        label: "Bounty Tersedia",
        href: "/supplier/bounties",
        icon: ClipboardList,
        match: (pathname) => pathname.startsWith("/supplier/bounties"),
      },
    ];
  }

  if (normalized === "buyer") {
    return [
      {
        label: "Dashboard Buyer",
        href: "/buyer",
        icon: LayoutDashboard,
        match: (pathname) => pathname === "/buyer",
      },
    ];
  }

  return [];
}

function getRoleLabel(role?: string | null) {
  const normalized = (role || "").toLowerCase();

  if (normalized === "admin") return "Admin";
  if (normalized === "supplier" || normalized === "farmer") return "Supplier";
  if (normalized === "buyer") return "Buyer";
  return "Guest";
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const [manualOpenItems, setManualOpenItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleDropdown = (key: string, defaultOpen: boolean) => {
    setManualOpenItems((current) => ({
      ...current,
      [key]: !(current[key] ?? defaultOpen),
    }));
  };

  return (
    <div>
      {title ? (
        <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          {title}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);

          const childActive = item.children?.some((child) =>
            child.match ? child.match(pathname) : pathname === child.href
          );

          const active = item.match
            ? item.match(pathname)
            : Boolean(childActive);

          const dropdownKey = `${title || "global"}-${item.href}-${item.label}`;
          const isDropdownOpen = hasChildren
            ? manualOpenItems[dropdownKey] ?? Boolean(active || childActive)
            : false;

          if (hasChildren) {
            return (
              <div key={dropdownKey}>
                <button
                  type="button"
                  onClick={() => toggleDropdown(dropdownKey, Boolean(active))}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                    active
                      ? "signature-gradient text-white shadow-sm"
                      : "bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isDropdownOpen && "rotate-90"
                    )}
                  />
                </button>

                {isDropdownOpen ? (
                  <div className="ml-5 mt-1.5 space-y-1 border-l border-outline-variant/15 pl-3">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const childIsActive = child.match
                        ? child.match(pathname)
                        : pathname === child.href;

                      return (
                        <Link
                          key={`child-${child.href}-${child.label}`}
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition-all",
                            childIsActive
                              ? "bg-primary/10 text-primary"
                              : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              key={dropdownKey}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                active
                  ? "signature-gradient text-white shadow-sm"
                  : "bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  !active && "group-hover:translate-x-0.5"
                )}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function UniversalAppShell({
  title,
  description,
  children,
  actions,
  role,
  user,
  onLogout,
  isLoggingOut = false,
  showHeader = true,
  publicCtaHref = "/register",
  publicCtaLabel = "Mulai Sekarang",
}: UniversalAppShellProps) {
  const pathname = usePathname();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [profileMenuStyle, setProfileMenuStyle] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);

  const roleNav = useMemo(() => getRoleNav(role), [role]);
  const roleLabel = getRoleLabel(role);
  const normalizedRole = (role || "").toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const isLoggedIn = Boolean(role);
  const profileName = user?.name?.trim() || roleLabel;
  const profileEmail =
    user?.email?.trim() || (isLoggedIn ? `${roleLabel} aktif` : "Pengunjung");

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setOpenProfileMenu(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!openProfileMenu) return;

    const updateProfileMenuPosition = () => {
      const trigger = profileTriggerRef.current;
      const menu = profileMenuRef.current;
      if (!trigger || !menu) return;

      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const gap = 12;
      const viewportPadding = 16;

      let left = triggerRect.left;
      const maxLeft = window.innerWidth - menuRect.width - viewportPadding;
      left = Math.min(
        Math.max(left, viewportPadding),
        Math.max(viewportPadding, maxLeft)
      );

      let top = triggerRect.top - menuRect.height - gap;
      if (top < viewportPadding) {
        top = Math.min(
          triggerRect.bottom + gap,
          window.innerHeight - menuRect.height - viewportPadding
        );
      }

      setProfileMenuStyle({ left, top });
    };

    updateProfileMenuPosition();
    window.addEventListener("resize", updateProfileMenuPosition);
    window.addEventListener("scroll", updateProfileMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateProfileMenuPosition);
      window.removeEventListener("scroll", updateProfileMenuPosition, true);
    };
  }, [openProfileMenu]);

  const closeMenus = () => {
    setOpenMobileMenu(false);
    setOpenProfileMenu(false);
  };

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-outline-variant/15 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="signature-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <p className="font-headline text-xl font-extrabold tracking-tight text-primary">
              GoGrowcery
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Precision Harvest
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-4 py-6">
        {!isAdmin ? (
          <NavSection items={globalNav} pathname={pathname} onNavigate={closeMenus} />
        ) : null}

        {roleNav.length > 0 ? (
          <NavSection
            title={isAdmin ? undefined : "Admin Menu"}
            items={roleNav}
            pathname={pathname}
            onNavigate={closeMenus}
          />
        ) : null}
      </div>

      <div className="relative shrink-0 overflow-visible border-t border-outline-variant/15 p-4">
        {isLoggedIn ? (
          <>
            <button
              ref={profileTriggerRef}
              type="button"
              onClick={() => setOpenProfileMenu((prev) => !prev)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant/15 bg-white text-on-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              aria-label={openProfileMenu ? "Tutup profil" : "Buka profil"}
              aria-expanded={openProfileMenu}
            >
              <UserCircle2 className="h-5 w-5" />
            </button>

            {openProfileMenu && typeof document !== "undefined"
              ? createPortal(
                  <div
                    ref={profileMenuRef}
                    className="fixed z-[200] w-[220px] rounded-3xl border border-outline-variant/15 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
                    style={
                      profileMenuStyle
                        ? { left: profileMenuStyle.left, top: profileMenuStyle.top }
                        : { left: -9999, top: -9999 }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                        <UserCircle2 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-on-surface">
                          {profileName}
                        </p>
                        <p className="mt-1 truncate text-xs text-on-surface-variant">
                          {profileEmail}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                        {roleLabel}
                      </span>
                      <span className="inline-flex rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                        Aktif
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href="/"
                        onClick={closeMenus}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/15 bg-surface-container-low text-on-surface transition hover:bg-surface-container-high"
                        title="Landing Page"
                        aria-label="Landing Page"
                      >
                        <Home className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/15 bg-surface-container-low text-on-surface transition hover:bg-surface-container-high"
                        aria-label="Pengaturan"
                        title="Pengaturan"
                      >
                        <Settings className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={isLoggingOut}
                        onClick={() => {
                          setOpenProfileMenu(false);
                          onLogout?.();
                        }}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-on-surface text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        aria-label={isLoggingOut ? "Sedang logout" : "Logout"}
                        title={isLoggingOut ? "Sedang logout..." : "Logout"}
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>,
                  document.body
                )
              : null}
          </>
        ) : (
          <div className="grid gap-2">
            <Link
              href="/login"
              onClick={closeMenus}
              className="inline-flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
            >
              <span>Login</span>
              <LogIn className="h-4 w-4" />
            </Link>

            <Link
              href={publicCtaHref}
              onClick={closeMenus}
              className="signature-gradient inline-flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
            >
              <span>{publicCtaLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-outline-variant/15 bg-surface-container-lowest lg:block">
          {sidebar}
        </aside>

        {openMobileMenu ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpenMobileMenu(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-[88%] max-w-[22rem] border-r border-outline-variant/15 bg-surface-container-lowest shadow-2xl">
              <div className="flex items-center justify-end border-b border-outline-variant/15 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenMobileMenu(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="h-[calc(100%-65px)]">{sidebar}</div>
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {showHeader ? (
            <header className="sticky top-0 z-40 border-b border-outline-variant/15 bg-surface-container-lowest shadow-sm">
              <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 md:px-8">
                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenMobileMenu(true)}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface lg:hidden"
                    >
                      <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      {title ? (
                        <h1 className="font-headline text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl md:text-3xl">
                          {title}
                        </h1>
                      ) : null}

                      {description ? (
                        <p className="mt-1 max-w-4xl text-sm leading-6 text-on-surface-variant md:leading-7">
                          {description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {actions ? (
                    <div className="w-full shrink-0 2xl:w-auto 2xl:max-w-[56rem] 2xl:self-start">
                      {actions}
                    </div>
                  ) : null}
                </div>
              </div>
            </header>
          ) : (
            <div className="sticky top-0 z-40 border-b border-outline-variant/15 bg-surface-container-lowest px-4 py-4 sm:px-5 lg:hidden">
              <button
                type="button"
                onClick={() => setOpenMobileMenu(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          )}

          <main className="px-4 py-5 sm:px-5 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}