"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Handshake,
  Loader2,
  LogOut,
  ShieldCheck,
  Sprout,
  Star,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import UniversalAppShell from "@/components/common/universal-app-shell";
import { getMe, logout } from "@/features/auth/api";
import {
  clearAuthSession,
  getAccessToken,
  getUserRole,
} from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { getAuthErrorMessage } from "@/features/auth/utils";
import { getRoleRedirectPath } from "@/lib/role-redirect";

const partnerItems = [
  {
    title: "Buyer & Brand",
    description:
      "Terhubung dengan pemasok yang relevan untuk kebutuhan bahan, suplai, dan pengadaan yang lebih terstruktur.",
    icon: Store,
  },
  {
    title: "Supplier & Farmer",
    description:
      "Mendapat akses ke peluang permintaan yang lebih jelas dengan alur pengajuan yang lebih rapi.",
    icon: Sprout,
  },
  {
    title: "Operational Team",
    description:
      "Memonitor proses dari kebutuhan awal, peninjauan, hingga tindak lanjut operasional.",
    icon: Truck,
  },
];

const testimonials = [
  {
    name: "Tim Pengadaan",
    role: "Buyer",
    quote:
      "Tampilan platform jauh lebih mudah dipahami untuk kebutuhan koordinasi dan review awal.",
  },
  {
    name: "Mitra Supplier",
    role: "Supplier",
    quote:
      "Alur pendaftaran dan akses ke peluang kebutuhan terasa lebih jelas dan lebih meyakinkan.",
  },
  {
    name: "Tim Operasional",
    role: "Internal Team",
    quote:
      "Struktur halaman sekarang terasa lebih siap dilihat user dan lebih konsisten antar role.",
  },
];

const guideSteps = [
  {
    title: "Jelajahi informasi platform",
    description:
      "Lihat profil platform, partner strategis, testimoni, panduan, dan FAQ dari sidebar global.",
  },
  {
    title: "Masuk atau daftar sesuai kebutuhan",
    description:
      "Guest dapat login atau memilih jalur registrasi yang sesuai dari area sidebar.",
  },
  {
    title: "Akses fitur sesuai role",
    description:
      "Setelah login, sidebar yang sama akan tetap tampil dan otomatis menambahkan menu sesuai role Anda.",
  },
];

const faqs = [
  {
    question: "Siapa yang bisa menggunakan GoGrowcery?",
    answer:
      "Platform ini disiapkan untuk buyer, supplier, farmer partner, dan tim internal yang membutuhkan alur kerja yang lebih rapi.",
  },
  {
    question: "Apakah sidebar tetap sama setelah login?",
    answer:
      "Ya. Menu global tetap ada, lalu akan ditambahkan menu khusus sesuai role yang sedang login.",
  },
  {
    question: "Apakah logout dan info profil ada di sidebar?",
    answer:
      "Ya. Informasi profil ringkas, tombol logout, dan akses cepat lain diletakkan di bagian bawah sidebar.",
  },
  {
    question: "Apakah perubahan ini mengubah backend?",
    answer:
      "Tidak. Perubahan tahap ini difokuskan ke sisi tampilan dan struktur shell antarmuka.",
  },
];

export default function PublicHomeTabs() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const currentRole = getUserRole();
    setRole(currentRole);

    if (!token) return;

    let isMounted = true;
    setIsLoadingProfile(true);

    getMe()
      .then((response) => {
        if (!isMounted) return;
        setUser(response.user);
        setRole(response.user.role || currentRole);
      })
      .catch(() => {
        if (!isMounted) return;
        clearAuthSession();
        setUser(null);
        setRole(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("Logout berhasil");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      clearAuthSession();
      setUser(null);
      setRole(null);
      setIsLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  };

  const workspaceHref = useMemo(() => getRoleRedirectPath(role), [role]);

  return (
    <UniversalAppShell
      role={role}
      user={user}
      onLogout={role ? handleLogout : undefined}
      isLoggingOut={isLoggingOut}
      showHeader={false}
      publicCtaHref="/register"
      publicCtaLabel="Daftar"
    >
      <div className="mx-auto max-w-7xl space-y-8 lg:space-y-10">
        <section className="overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="grid gap-8 px-6 py-10 md:px-8 xl:grid-cols-[1.15fr_0.85fr] xl:px-10 xl:py-12">
            <div>
              <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                GoGrowcery Platform
              </div>

              <h1 className="mt-5 font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl xl:text-6xl">
                Platform penghubung buyer, supplier, dan partner strategis.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-on-surface-variant md:text-lg">
                Struktur halaman kini dibuat lebih siap dilihat user: sidebar
                global, tampilan yang lebih konsisten, dan akses fitur tambahan
                sesuai role setelah login.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {role ? (
                  <Link
                    href={workspaceHref}
                    className="signature-gradient inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                  >
                    Buka Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-3.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-high"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="signature-gradient inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                    >
                      Daftar Sekarang
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4 self-start sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl bg-surface-container-low p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-headline text-xl font-bold text-on-surface">
                  Sidebar Global
                </h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  About Us, Strategic Partner, Testimoni, Guide, dan FAQ menjadi
                  struktur dasar untuk semua user.
                </p>
              </div>

              <div className="rounded-3xl bg-surface-container-low p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-headline text-xl font-bold text-on-surface">
                  Fitur Berdasarkan Role
                </h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Setelah login, menu role akan ditambahkan tanpa menghilangkan
                  menu global yang sudah ada.
                </p>
              </div>

              {isLoadingProfile ? (
                <div className="rounded-3xl bg-surface-container-low p-5 sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memuat sesi pengguna...</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="about-us" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-headline text-3xl font-extrabold text-on-surface">
              About Us
            </h2>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">
              GoGrowcery dirancang sebagai platform yang membantu proses
              penghubung antara kebutuhan buyer, kesiapan supplier, dan arah
              kerja partner strategis dalam satu tampilan yang lebih jelas.
            </p>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">
              Fokus tahap ini adalah memperbaiki pengalaman visual agar lebih
              profesional, lebih mudah dipahami user, dan lebih konsisten di
              setiap role.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Buyer
              </p>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                Akses informasi platform dan lanjut ke area kerja sesuai akun.
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Supplier
              </p>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                Mendapat jalur yang lebih rapi untuk masuk dan melihat peluang.
              </p>
            </div>
            <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Admin
              </p>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                Tetap memakai sidebar yang sama, dengan tambahan fitur kerja.
              </p>
            </div>
          </div>
        </section>

        <section id="strategic-partner" className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Handshake className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-headline text-3xl font-extrabold text-on-surface">
              Strategic Partner
            </h2>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">
              Platform ini diposisikan untuk mendukung hubungan kerja yang lebih
              baik antara buyer, supplier, farmer partner, dan tim operasional.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {partnerItems.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-3xl bg-surface-container-low p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-headline text-xl font-bold text-on-surface">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="testimoni" className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Star className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-headline text-3xl font-extrabold text-on-surface">
              Testimoni
            </h2>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">
              Tampilan baru diarahkan agar lebih meyakinkan untuk user saat
              pertama kali membuka platform.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={`${item.name}-${item.role}`}
                className="rounded-3xl bg-surface-container-low p-6"
              >
                <p className="text-sm leading-7 text-on-surface-variant">
                  “{item.quote}”
                </p>
                <div className="mt-5">
                  <p className="font-bold text-on-surface">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                    {item.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="guide" className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-headline text-3xl font-extrabold text-on-surface">
              Guide
            </h2>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">
              Alur penggunaan dibuat sederhana agar user langsung memahami posisi
              mereka di dalam platform.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {guideSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-3xl bg-surface-container-low p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-headline text-xl font-bold text-on-surface">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-headline text-3xl font-extrabold text-on-surface">
              FAQ
            </h2>
            <p className="mt-4 text-base leading-8 text-on-surface-variant">
              Pertanyaan umum yang paling relevan untuk tampilan awal user.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="rounded-3xl bg-surface-container-low p-6"
              >
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

        <section className="rounded-[2rem] bg-primary p-8 text-white shadow-xl">
          <h2 className="font-headline text-3xl font-extrabold md:text-4xl">
            Siap masuk ke platform?
          </h2>
          <p className="mt-4 max-w-2xl text-white/85">
            Gunakan login untuk akun yang sudah ada, atau pilih jalur registrasi
            yang sesuai untuk memulai.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {role ? (
              <>
                <Link
                  href={workspaceHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-primary"
                >
                  Buka Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-5 py-3 font-bold text-white disabled:opacity-70"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Sedang logout..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register/buyer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-primary"
                >
                  Daftar Buyer
                </Link>
                <Link
                  href="/register/supplier"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-5 py-3 font-bold text-white"
                >
                  Daftar Supplier
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </UniversalAppShell>
  );
}
