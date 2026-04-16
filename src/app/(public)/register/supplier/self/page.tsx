import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";
import RegisterSupplierForm from "@/features/auth/components/register-supplier-form";

export default function RegisterSupplierSelfPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicAuthTopbar />

      <main className="flex min-h-screen items-center justify-center px-6 pb-20 pt-24">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden overflow-hidden rounded-[2rem] bg-on-background p-10 text-white shadow-2xl lg:block">
            <div className="flex h-full flex-col justify-between gap-12">
              <div>
                <span className="inline-flex rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-fixed-dim">
                  Supplier Self Register
                </span>

                <h1 className="mt-6 font-headline text-4xl font-extrabold leading-tight">
                  Join the network through the direct supplier registration flow.
                </h1>

                <p className="mt-6 max-w-xl text-base leading-8 text-white/75">
                  This path is intended for suppliers who create and manage their
                  own account directly.
                </p>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl bg-white/6 p-5 ring-1 ring-white/10">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-fixed-dim">
                    Direct
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Supplier fills account data independently.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/6 p-5 ring-1 ring-white/10">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-fixed-dim">
                    Standard
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Uses the current public supplier registration form.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-[0_24px_48px_-12px_rgba(25,28,30,0.06)] md:p-12">
            <div className="mb-10">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Self Register as Supplier
              </h2>
              <p className="mt-3 max-w-xl text-on-surface-variant">
                Register your supplier account directly to join the GoGrowcery
                network.
              </p>
            </div>

            <RegisterSupplierForm />
          </section>
        </div>
      </main>
    </div>
  );
}