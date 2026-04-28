import { Loader2, Sprout } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
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
          Membuka halaman...
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>

        <p className="mt-4 text-xs leading-5 text-on-surface-variant">
          Mohon tunggu sebentar. Sistem sedang menyiapkan halaman.
        </p>
      </div>
    </div>
  );
}