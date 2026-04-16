import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";
import RegisterBuyerForm from "@/features/auth/components/register-buyer-form";

export default function RegisterBuyerPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <PublicAuthTopbar />

      <main className="flex min-h-screen items-center justify-center bg-surface px-6 pb-20 pt-24">
        <div className="w-full max-w-xl">
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-[0_24px_48px_-12px_rgba(25,28,30,0.06)] md:p-12">
            <div className="mb-10 text-center">
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Create your Buyer Account
              </h1>
              <p className="mt-3 font-medium text-on-surface-variant">
                Set up your business profile in minutes.
              </p>
            </div>

            <RegisterBuyerForm />

            <div className="mt-12 flex flex-col items-center gap-4 border-t border-outline-variant/15 pt-8">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Trusted by Industry Leaders
              </span>

              <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale contrast-125">
                <div className="h-6 w-24 rounded-full bg-on-surface-variant/20" />
                <div className="h-6 w-20 rounded-full bg-on-surface-variant/20" />
                <div className="h-6 w-28 rounded-full bg-on-surface-variant/20" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex w-full flex-col items-center justify-center gap-8 bg-transparent px-6 py-12 text-xs uppercase tracking-[0.18em] md:flex-row">
        <div className="text-slate-500">© 2026 The Precision Harvest.</div>
        <div className="flex gap-6">
          <span className="text-slate-500">Terms of Service</span>
          <span className="text-slate-500">Privacy Policy</span>
          <span className="text-slate-500">Help Center</span>
        </div>
      </footer>
    </div>
  );
}