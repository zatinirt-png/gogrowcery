"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Factory,
  FileText,
  Filter,
  Globe2,
  Info,
  LayoutDashboard,
  Leaf,
  LogIn,
  LogOut,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Store,
  Truck,
  UserCircle2,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { logout } from "@/features/auth/api";
import {
  clearAuthSession,
  getAccessToken,
  getUserRole,
} from "@/features/auth/storage";
import { cn } from "@/lib/cn";
import { getRoleRedirectPath } from "@/lib/role-redirect";

type HomeTab =
  | "overview"
  | "workflow"
  | "features"
  | "supplier"
  | "faq"
  | "catalog";

type ProductCategory = "all" | "vegetables" | "fruits" | "herbs" | "staples";

type ProductItem = {
  name: string;
  price: string;
  unit: string;
  status: "In Stock" | "Limited Supply" | "Coming Soon";
  badge?: string;
  category: Exclude<ProductCategory, "all">;
  description: string;
  region: string;
  image: string;
};

const tabs: {
  key: HomeTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "overview", label: "Dashboard Home", icon: LayoutDashboard },
  { key: "catalog", label: "Product Catalog", icon: PackageSearch },
  { key: "workflow", label: "Workflow", icon: Boxes },
  { key: "features", label: "Insight Hub", icon: Users },
  { key: "supplier", label: "Supplier Network", icon: Sprout },
  { key: "faq", label: "About GoGrowcery", icon: Info },
];

const categoryTabs: { key: ProductCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruits", label: "Fruits" },
  { key: "herbs", label: "Herbs" },
  { key: "staples", label: "Staples" },
];

const problems = [
  {
    title: "Inconsistent Supply",
    description:
      "Seasonal volatility and fragmented sourcing create unstable planning and poor execution visibility.",
    icon: AlertTriangle,
  },
  {
    title: "Manual Procurement",
    description:
      "Phone calls, spreadsheets, and scattered approvals slow down sourcing and purchasing decisions.",
    icon: FileText,
  },
  {
    title: "Low Visibility",
    description:
      "Operational teams often lack real-time context across stock, offers, and supplier response.",
    icon: Search,
  },
  {
    title: "Messy Records",
    description:
      "Documentation and invoicing become harder when procurement data is disconnected from execution.",
    icon: Boxes,
  },
];

const workflowSteps = [
  "Buyer creates request",
  "System checks stock availability",
  "Bounty is opened to supplier network",
  "Suppliers submit offers",
  "Fulfillment is tracked in real time",
  "Payment and records are finalized",
];

const featureCards = [
  {
    title: "Inventory Visibility",
    description:
      "See product availability and procurement context more clearly across the sourcing process.",
    icon: Boxes,
  },
  {
    title: "Supplier Matching",
    description:
      "Connect buyer-side requests to relevant supplier profiles with cleaner operational structure.",
    icon: Users,
  },
  {
    title: "Fulfillment Tracking",
    description:
      "Track continuity from sourcing submission to delivery-handling and completion.",
    icon: Truck,
  },
  {
    title: "Documentation Layer",
    description:
      "Keep transaction records, evidence, and procurement documents more structured.",
    icon: FileText,
  },
  {
    title: "Trust and Verification",
    description:
      "Support governance-minded workflows for onboarding and procurement quality assurance.",
    icon: ShieldCheck,
  },
  {
    title: "Demand Access",
    description:
      "Suppliers get a clearer entry point into buyer demand and request opportunities.",
    icon: Globe2,
  },
];

const faqs = [
  {
    question: "Who can use GoGrowcery?",
    answer:
      "The platform is structured for buyers, supplier or farmer partners, and internal admin teams that manage procurement workflows.",
  },
  {
    question: "Do buyers and suppliers use the same login page?",
    answer:
      "Yes. Login remains centralized, and the frontend redirects the user based on their role after authentication.",
  },
  {
    question: "How does supplier onboarding work?",
    answer:
      "Suppliers register through a dedicated supplier flow and continue through internal approval and governance steps.",
  },
  {
    question: "Can the catalog be connected to API later?",
    answer:
      "Yes. The current version is structured as a clean UI shell, so search, filters, pagination, and products can be connected later without redesigning the page.",
  },
];

const products: ProductItem[] = [
  {
    name: "Organic Spinach",
    price: "$4.20",
    unit: "500g",
    status: "In Stock",
    badge: "Verified Organic",
    category: "vegetables",
    description:
      "Triple-washed tender baby leaves sourced from Highland Organic Estate.",
    region: "North Highland Farms",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDK_3NrH_NBtNCHEJeZXJwg2_zT8ckF34qlU3jI0-0RxJ32z7GVn-wo3ThRubZB_tdt77RIeJsWH4nbbx9xPmPaQVGhjI78r7Gb4KF_WmwF7WbTeQAn9lsP2w6JGqqBh52HMP7AO5xqUbm9Ks8txRIhExuZ93g93l6IjLuJGkMtMdLaBlSrYbXdrb7TFElRGXhsnXfPBGlAqik-3Y62Km4EcY8dPGzwbMBS1O6vgGcavXl56CUnvLAJM7Ks5KV3kRUdh_qebqL7sVs",
  },
  {
    name: "Vine-Ripened Tomatoes",
    price: "$6.50",
    unit: "1kg",
    status: "Limited Supply",
    badge: "Season's Best",
    category: "vegetables",
    description:
      "Heirloom variety with intense flavor, harvested daily in the Central Valley.",
    region: "Central Valley Co-op",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnV6sf441yS_5bYhn57MyPnBbO4C4Um6QQ1GyBIdnfGBXcPfowb6ohEKb-uKqtYLLpDnYzv9chciW8h0ZRyUVsRyPPGDDT4vgVSEpIIwZHar40shxuq_HDZKf0XaRZWbso7KRU8PP6Pl3AH9CDXKJFpkxUg3e1M7JMSXtw7mXoUCy6sPqAkKV7QfwnRKKUd7W71yoOO4-AULKFS0dFt_xGj2h4V4YW_exsZOR984eeijRI0ri_FHatU3kfmq6OqnOByISnC8RDWdk",
  },
  {
    name: "Fresh Cilantro",
    price: "$1.80",
    unit: "Bunch (100g)",
    status: "In Stock",
    category: "herbs",
    description:
      "Pungent and aromatic greenhouse-grown herbs from local urban farms.",
    region: "Coastal Organic Ridge",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBw9kLX2BnaapfM-dAXEahxnlaT1o2y9-kLpZUVSVuXDXmD7yRZkwhLNJw4EXLdDU7eLOYbEdIS7TnHzOl3yNJmpc1EIup96TZJmA1DB8mJsPHcvS4qNxR_mahjOUbse7tlJ1lSJjw6W-HL1XXQjBNRKHAa0cbULkgHQgK_iFw-CBqvKdaNQvYhnnA_ps4XrHOjYdf26-N4yV86R-B6eqQWjvYAEOxL4rdIo-nNdsOrnFaVCktHX4D8Q_BCD4MNVyRolJM9W8t4tPA",
  },
  {
    name: "White Cauliflower",
    price: "$3.10",
    unit: "Piece",
    status: "In Stock",
    category: "vegetables",
    description:
      "Dense, ivory-colored florets, excellent for processing or fresh sale.",
    region: "North Highland Farms",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCXHLpVmw2q9ZsbxsiDjb18fQHSC1iFIgYdYGNRgxdRnkB3gF-NSSvC1nRpnMZYXqcBJHU_Pc5_SUHj3yiA5ajpsJfH-3ryUuuki7KHxwGzYs8Sp_BjnJfueFhiaawDUkE_9jeEhU-ekBXqYYiJPFsa91mUisiX_sbpFhbagpGiVBZEO4v3UZN2FY03SqRm_Mzlr-GPLcL5dpXLvixHWS0WhjyCjLd0d4xCHHN42DB7ZDixS_1B35bH6usRs6md6Glmsi0dAuTTXRY",
  },
  {
    name: "Bell Pepper Mix",
    price: "$5.80",
    unit: "500g",
    status: "In Stock",
    category: "vegetables",
    description:
      "A colorful trio of premium sweet bell peppers. Farm to table within 24h.",
    region: "Coastal Organic Ridge",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuATdUOpQANVHS15IzzRVK3ipV7Mg7wSJDX4T050tfWQf8xxQafFLUOUwzHv_8JsDtK4DiG4tavpPJnWfQzF3XJ6dRqIAnZQWwrn7l9fy0hEVj67880VaPZRDQ1ZcTK5TSLIyT9CHc6L67sW4wHlZ6ARIrKzg5fUgOPhUmlw03LqLpTCqdriva1zIImCcS1G7RRhxo_Dp5PHpAuBcn9_Ko45BOq8c3LtJ_53jmxZN9oO92ftWLefcZkiddfR7Mtj5RHROqAnD0bOYUM",
  },
  {
    name: "Crunchy Carrots",
    price: "$2.40",
    unit: "1kg",
    status: "In Stock",
    badge: "Bestseller",
    category: "vegetables",
    description:
      "Sweet and crisp Nantes-style carrots, harvested from rich volcanic soil.",
    region: "Central Valley Co-op",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBdgAuSxXuEW4Iw78gH-IBl4XCDNzs3gGxc23vByoDCfJKYN35yswCMjaM37v-Zlb5tQcwZQstKDoLoiAtmGXFUXfQY0vXF_zQuGKq58HFkcJX3h7RvEK0_rPWqnNvGqDh1A6CiYJh3mn4cX4M2cTLiU5WbX94hzhOhO5rsyJU_GvAskMyI0MorI5ALy_7WR9NnBeLPtWVt3EsQGMflIh8tc_eysbnl5Wcg7ph5nFG2tBfsT4drFsnrdoFxwpPm3GwVYSopeWghtFI",
  },
];

function ProductCard({ item }: { item: ProductItem }) {
  const statusColor =
    item.status === "Limited Supply"
      ? "text-tertiary"
      : item.status === "Coming Soon"
      ? "text-secondary"
      : "text-primary";

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {item.badge && (
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-surface/90 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-primary backdrop-blur-md">
              {item.badge}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-headline text-lg font-bold text-on-surface">
            {item.name}
          </h3>
          <span className="font-bold text-primary">{item.price}</span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-secondary">{item.unit}</span>
          <span className="h-1 w-1 rounded-full bg-outline-variant" />
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              statusColor
            )}
          >
            {item.status}
          </span>
        </div>

        <p className="mb-2 text-sm text-secondary">{item.description}</p>
        <p className="mb-6 text-xs text-on-surface-variant">{item.region}</p>

        <div className="mt-auto flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg bg-surface-container-high py-2.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            Details
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary-container p-2.5 text-on-primary-container transition hover:brightness-95"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function TopBar({
  search,
  setSearch,
}: {
  search: string;
  setSearch: (value: string) => void;
}) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const currentRole = getUserRole();

    setIsLoggedIn(Boolean(token));
    setRole(currentRole);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const roleLabel = !role
    ? "Guest"
    : role === "supplier"
    ? "Supplier / Farmer"
    : role.charAt(0).toUpperCase() + role.slice(1);

  const statusLabel = isLoggedIn ? "Authenticated" : "Public Visitor";

  const handleOpenWorkspace = () => {
    setIsProfileOpen(false);

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    router.push(getRoleRedirectPath(role));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("Logout berhasil");
    } catch {
      toast.error("Sesi browser dibersihkan");
    } finally {
      clearAuthSession();
      setIsLoggedIn(false);
      setRole(null);
      setIsProfileOpen(false);
      setIsLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/80 px-6 py-3 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold tracking-tight text-green-800">
          GoGrowcery
        </span>

        <div className="hidden items-center rounded-xl bg-slate-100 px-4 py-2 md:flex">
          <Search className="mr-2 h-4 w-4 text-slate-500" />
          <input
            className="w-64 bg-transparent text-sm text-on-surface outline-none"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-50"
        >
          <Boxes className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-50"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-2 py-1.5 transition hover:bg-surface-container-low"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant/15 bg-surface-container-high">
              <UserCircle2 className="h-5 w-5 text-slate-600" />
            </div>

            <div className="hidden text-left md:block">
              <p className="text-xs font-bold text-on-surface">
                {roleLabel}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
                {statusLabel}
              </p>
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-500 transition-transform",
                isProfileOpen && "rotate-180"
              )}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-xl">
              <div className="border-b border-outline-variant/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Profile Menu
                </p>

                <div className="mt-4 rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                    Login as
                  </p>
                  <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">
                    {roleLabel}
                  </p>

                  <div className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {statusLabel}
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3">
                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenWorkspace}
                      className="flex w-full items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
                    >
                      <span>Open Workspace / Profile</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center justify-between rounded-xl bg-on-surface px-4 py-3 text-left text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
                    >
                      <span>Login</span>
                      <LogIn className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                    >
                      <span>Register</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;
}) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-slate-50 pt-16 md:flex">
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
          <Sprout className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-on-surface">Precision Harvest</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Verified Buyer
          </p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all",
                isActive
                  ? "border-r-4 border-green-600 bg-green-50 font-bold text-green-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-green-600"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <Link
          href="/register/buyer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition active:scale-95"
        >
          <ArrowRight className="h-4 w-4" />
          <span>New Procurement</span>
        </Link>
      </div>
    </aside>
  );
}

function MobileBottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;
}) {
  const navItems: { key: HomeTab; label: string; icon: React.ReactNode }[] = [
    {
      key: "overview",
      label: "Home",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      key: "catalog",
      label: "Catalog",
      icon: <PackageSearch className="h-5 w-5" />,
    },
    {
      key: "features",
      label: "Insight",
      icon: <Users className="h-5 w-5" />,
    },
    {
      key: "supplier",
      label: "Profile",
      icon: <Sprout className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-white/85 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden">
      {navItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key)}
            className={cn(
              "flex flex-col items-center gap-1",
              isActive ? "text-green-700" : "text-slate-500"
            )}
          >
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function OverviewView() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-surface-container-low p-8">
        <div className="max-w-3xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
            Dashboard Home
          </span>
          <h1 className="mt-4 font-headline text-4xl font-extrabold text-on-surface">
            Precision Procurement for Modern Agri-Business
          </h1>
          <p className="mt-4 text-lg font-medium leading-8 text-on-surface-variant">
            This public homepage now behaves like a full app shell. The sidebar
            stays fixed, and the whole content panel changes when the active tab
            changes.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {problems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-xl bg-surface-container-lowest p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-headline text-xl font-bold text-on-surface">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-primary-container/15 p-8">
          <p className="text-4xl font-extrabold text-primary">24/7</p>
          <p className="mt-3 font-headline text-xl font-bold text-on-surface">
            Request visibility
          </p>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Buyers and operators gain cleaner visibility into procurement flow.
          </p>
        </div>

        <div className="rounded-xl bg-primary-container/15 p-8">
          <p className="text-4xl font-extrabold text-primary">3 Roles</p>
          <p className="mt-3 font-headline text-xl font-bold text-on-surface">
            Admin, Buyer, Supplier
          </p>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Public, auth, and role-based access remain aligned.
          </p>
        </div>

        <div className="rounded-xl bg-primary-container/15 p-8">
          <p className="text-4xl font-extrabold text-primary">1 Flow</p>
          <p className="mt-3 font-headline text-xl font-bold text-on-surface">
            Unified procurement path
          </p>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            From request to supplier response, fulfillment, and records.
          </p>
        </div>
      </section>
    </div>
  );
}

function WorkflowView() {
  return (
    <section className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
      <div className="max-w-3xl">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
          Workflow
        </span>
        <h1 className="mt-4 font-headline text-4xl font-extrabold text-on-surface">
          A Procurement Flow Designed to Be Understandable
        </h1>
        <p className="mt-4 text-lg leading-8 text-on-surface-variant">
          This view replaces the whole content panel when the active tab changes.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <div key={step} className="rounded-xl bg-surface-container-low p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
              {index + 1}
            </div>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-on-surface">
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesView() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
        <div className="max-w-3xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
            Insight Hub
          </span>
          <h1 className="mt-4 font-headline text-4xl font-extrabold text-on-surface">
            Core Procurement Features
          </h1>
          <p className="mt-4 text-lg leading-8 text-on-surface-variant">
            This tab now owns the whole right-side page area.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-xl bg-surface-container-low p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-headline text-xl font-bold text-on-surface">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-surface-container-lowest p-7 shadow-sm">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h3 className="mt-5 font-headline text-xl font-bold">Restaurants</h3>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Buyer teams with structured ingredient demand.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-7 shadow-sm">
          <Store className="h-6 w-6 text-primary" />
          <h3 className="mt-5 font-headline text-xl font-bold">Retail</h3>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Multi-source sourcing and stock visibility.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-7 shadow-sm">
          <Factory className="h-6 w-6 text-primary" />
          <h3 className="mt-5 font-headline text-xl font-bold">Food Production</h3>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Cleaner incoming procurement handling.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-7 shadow-sm">
          <Leaf className="h-6 w-6 text-primary" />
          <h3 className="mt-5 font-headline text-xl font-bold">Supplier Networks</h3>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Clearer access to procurement opportunities.
          </p>
        </div>
      </section>
    </div>
  );
}

function SupplierView() {
  return (
    <section className="grid gap-8 rounded-2xl bg-surface-container-lowest p-8 shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
          Supplier Network
        </span>
        <h1 className="mt-4 font-headline text-4xl font-extrabold text-on-surface">
          For Suppliers and Farmers: Clearer Access to Demand
        </h1>
        <p className="mt-4 text-lg leading-8 text-on-surface-variant">
          This entire screen changes when the supplier tab is active.
        </p>

        <div className="mt-8 space-y-5">
          <div className="flex gap-4 rounded-xl bg-surface-container-low p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                Access to active opportunities
              </h3>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Supplier onboarding starts from a dedicated registration path.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl bg-surface-container-low p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                Verification-minded onboarding
              </h3>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Governance and approval remain controlled internally.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl bg-surface-container-low p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                Better process continuity
              </h3>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                From offer submission to fulfillment, the flow stays clearer.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/register/supplier"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white"
          >
            Apply as Supplier
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG0MUu2mt9cDTq5uN6T9zIt3JDXOVTtKzlWePfig1UjiAthFQrngiv7-946OhbhFHHxIxKdbHyeuO73DRfAbBnvfvSQ_IXbPZvvwEPaXTdjMnDVfFeCVhL7-eqeQOurJsOKnGZd6cAPn2zDlpUtqUWQmzZ7HzCmuyrdoHIXACFcr1L1d3-7PDATWpfQrLvJJd6_OztaPBUq4eGHOEZU76yN_SiISo6SHO4jgCtCIw5mlsZFInwMJLl-S3xYJXEwEH-ORflNEWEAGI"
          alt="Supplier growth"
          className="h-full min-h-[360px] w-full object-cover"
        />
      </div>
    </section>
  );
}

function FaqView() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm">
        <div className="max-w-3xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
            About GoGrowcery
          </span>
          <h1 className="mt-4 font-headline text-4xl font-extrabold text-on-surface">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg leading-8 text-on-surface-variant">
            This tab fully replaces the content area with FAQ and CTA.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((item) => (
            <details key={item.question} className="rounded-xl bg-surface-container-low p-6">
              <summary className="cursor-pointer list-none font-headline text-lg font-bold text-on-surface">
                {item.question}
              </summary>
              <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-primary p-8 text-white shadow-2xl">
        <h2 className="font-headline text-4xl font-extrabold">
          Ready to start with the right entry point?
        </h2>
        <p className="mt-4 max-w-2xl text-white/85">
          Buyer and supplier each have a dedicated registration path, while
          login remains centralized.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/register/buyer"
            className="rounded-xl bg-white px-5 py-3 font-bold text-primary"
          >
            Register as Buyer
          </Link>
          <Link
            href="/register/supplier"
            className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white"
          >
            Apply as Supplier
          </Link>
        </div>
      </section>
    </div>
  );
}

function CatalogView({
  activeCategory,
  setActiveCategory,
  filteredProducts,
  search,
  setSearch,
}: {
  activeCategory: ProductCategory;
  setActiveCategory: (category: ProductCategory) => void;
  filteredProducts: ProductItem[];
  search: string;
  setSearch: (value: string) => void;
}) {
  return (
    <>
      <header className="mb-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 font-headline text-4xl font-extrabold text-on-surface">
              Sustainable Sourcing
            </h1>
            <p className="font-medium text-secondary">
              Curating the finest harvest from verified regional growers.
            </p>
          </div>

          <div className="md:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full rounded-xl bg-slate-100 py-3 pl-11 pr-4 text-sm outline-none"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-2 rounded-full bg-surface-container-low p-1.5">
              {categoryTabs.map((category) => {
                const isActive = activeCategory === category.key;

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setActiveCategory(category.key)}
                    className={cn(
                      "rounded-full px-6 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-primary text-on-primary"
                        : "text-secondary hover:bg-surface-container-high"
                    )}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8 xl:flex-row">
        <aside className="w-full space-y-8 xl:w-72 xl:flex-shrink-0">
          <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface">Filters</h3>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setSearch("");
                }}
                className="text-xs font-bold uppercase tracking-widest text-primary"
              >
                Reset
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Availability
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      checked
                      readOnly
                      type="checkbox"
                      className="rounded border-outline-variant text-primary"
                    />
                    <span className="text-sm text-secondary">In Stock</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      readOnly
                      type="checkbox"
                      className="rounded border-outline-variant text-primary"
                    />
                    <span className="text-sm text-secondary">Limited Supply</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      readOnly
                      type="checkbox"
                      className="rounded border-outline-variant text-primary"
                    />
                    <span className="text-sm text-secondary">Coming Soon</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Sourcing Area
                </label>
                <select className="w-full rounded-lg border-none bg-surface-container-low p-3 text-sm focus:ring-2 focus:ring-primary-fixed-dim">
                  <option>All Regions</option>
                  <option>North Highland Farms</option>
                  <option>Central Valley Co-op</option>
                  <option>Coastal Organic Ridge</option>
                </select>
              </div>

              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Unit Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <span className="cursor-pointer rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-secondary">
                    500g
                  </span>
                  <span className="cursor-pointer rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
                    1kg
                  </span>
                  <span className="cursor-pointer rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-secondary">
                    Bulk (5kg+)
                  </span>
                  <span className="cursor-pointer rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-secondary">
                    Crate
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-primary/10 bg-primary/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-bold text-on-primary-container">
                Quality Assurance
              </h4>
            </div>
            <p className="text-xs leading-relaxed text-on-secondary-container">
              All products listed are sourced from regenerative farms verified by
              our quality protocol.
            </p>
          </section>
        </aside>

        <section className="flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((item) => (
              <ProductCard key={`${item.name}-${item.unit}`} item={item} />
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              type="button"
              className="rounded-xl bg-surface-container-high px-8 py-3 font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              Load More Products
            </button>
            <p className="text-xs italic text-secondary">
              Showing {filteredProducts.length} of {products.length} sample products
              in catalog
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

export default function PublicHomeTabs() {
  const [activeTab, setActiveTab] = useState<HomeTab>("catalog");
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("all");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const byCategory =
        activeCategory === "all" ? true : item.category === activeCategory;

      const q = search.trim().toLowerCase();
      const bySearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q);

      return byCategory && bySearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="h-screen overflow-hidden bg-background font-sans text-on-surface">
      <TopBar search={search} setSearch={setSearch} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="h-[calc(100vh-64px)] overflow-y-auto px-6 pb-24 pt-20 md:ml-64 md:pb-12">
        {activeTab === "overview" && <OverviewView />}
        {activeTab === "workflow" && <WorkflowView />}
        {activeTab === "features" && <FeaturesView />}
        {activeTab === "supplier" && <SupplierView />}
        {activeTab === "faq" && <FaqView />}
        {activeTab === "catalog" && (
          <CatalogView
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            filteredProducts={filteredProducts}
            search={search}
            setSearch={setSearch}
          />
        )}
      </main>
    </div>
  );
}