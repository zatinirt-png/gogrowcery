import LoginForm from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="flex min-h-screen items-stretch">
        <section className="relative hidden overflow-hidden bg-on-background lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
          <div className="absolute inset-0 z-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfD4u_P-djPk3QhiDg5j8vdkr3vLV61p1ZKJLzpKzaVONZH6Pym1gGZh-6_v5gk-JINuxo5WXIfFVwvZPlNc7w7V_qVTLbnrnxky-799DOCsbdtR-GdB3b8Iyfr5Hx1zjkQ0Pyyd6-tzK9n7N1-YMrKJeDYX-HbCfagKpqT6K37kMorFKd8IltNCH6etAv7QRUw68epa3_el_R9WEYV2SSY_EPYXiCeGFaIfUrucATNsp0o5S7Kxt1jFRhrwbVDDHXScCSlVBB5z0"
              alt="Agri-tech visual"
              className="h-full w-full object-cover opacity-50 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-on-background via-transparent to-transparent opacity-90" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="signature-gradient flex h-10 w-10 items-center justify-center rounded-xl">
                <span className="text-lg font-bold text-white">G</span>
              </div>
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white">
                GoGrowcery
              </h1>
            </div>

            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed-dim">
              The Precision Harvest
            </p>
          </div>

          <div className="relative z-10 max-w-md">
            <h2 className="mb-6 font-headline text-4xl font-bold leading-tight text-white">
              Optimizing the global supply chain, one harvest at a time.
            </h2>

            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-primary-container" />
              <p className="text-sm font-medium text-surface-variant">
                B2B Procurement Intelligence
              </p>
            </div>
          </div>
        </section>

        <main className="flex w-full flex-col items-center justify-center bg-surface p-6 sm:p-12 lg:w-1/2 lg:p-24">
          <div className="w-full max-w-[440px]">
            <header className="mb-10">
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-background">
                Welcome back
              </h2>
              <p className="mt-2 text-on-surface-variant">
                Enter your credentials to access the curator dashboard.
              </p>
            </header>

            <LoginForm />
          </div>

          <div className="mt-auto w-full max-w-[440px] pt-12">
            <div className="flex flex-wrap justify-center gap-6 opacity-60">
              <span className="text-[10px] uppercase tracking-[0.18em] text-on-secondary-container">
                Terms of Service
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-on-secondary-container">
                Privacy Policy
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-on-secondary-container">
                Help Center
              </span>
            </div>

            <p className="mt-4 text-center text-[10px] font-medium text-outline">
              © 2026 The Precision Harvest. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}