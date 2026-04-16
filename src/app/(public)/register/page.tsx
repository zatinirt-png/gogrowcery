import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";
import RegisterGatewayCards from "@/features/auth/components/register-gateway-cards";

export default function RegisterGatewayPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicAuthTopbar />

      <main className="flex min-h-screen flex-grow items-center justify-center px-6 pb-12 pt-24">
        <div className="w-full max-w-5xl">
          <div className="mb-16 text-center">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Join the GoGrowcery Network
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-on-surface-variant md:text-xl">
              Select your business type to get started.
            </p>
          </div>

          <RegisterGatewayCards />

          <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center justify-between gap-6 rounded-xl bg-surface-container-low p-6 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYjGHffuUaEPU3KoV-Dbi_K2SRz4inR78t2-5E7yyAYqoTKmN2srKPKL-rKfKsvYuZxj7NVazC6ZyYjX1zK5L2wVe2mtPEvJuizR0FSLyy2M4OePkBe60XBkCtlM0WM6f7XkZbTNHF0-3pTOLZ6GvQQdNHgO8Qf33Aweig56mpLWuSu3YE9HqqXwFcme2s709WLlBx1Ji9pHomWG4TmiKWLHlV_Ii-CZzFysrSMzvNYG43tNMVxaS8pZ8sLyUeRpvDLyRjR5Ea69g"
                  alt="Support"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface">
                  Need help deciding?
                </p>
                <p className="text-xs text-on-surface-variant">
                  Speak with our network specialist.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="text-sm font-bold text-primary transition hover:opacity-80"
            >
              Schedule a call
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full bg-transparent px-6 py-12 text-xs uppercase tracking-[0.18em]">
        <div className="flex flex-col items-center justify-center gap-8 border-t border-outline-variant/10 pt-12 md:flex-row">
          <div className="text-slate-600">© 2026 The Precision Harvest.</div>
          <div className="flex gap-6">
            <span className="text-slate-500">Terms of Service</span>
            <span className="text-slate-500">Privacy Policy</span>
            <span className="text-slate-500">Help Center</span>
          </div>
        </div>
      </footer>
    </div>
  );
}