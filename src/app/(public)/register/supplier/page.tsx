import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";
import RegisterSupplierPathOptions from "@/features/auth/components/register-supplier-path-options";

export default function RegisterSupplierPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicAuthTopbar />

      <main className="flex min-h-screen items-center justify-center px-6 pb-20 pt-24">
        <div className="w-full max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Supplier Registration Options
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-on-surface-variant">
              Pilih metode registrasi supplier yang paling sesuai: form cepat
              atau guided registration flow yang lebih lengkap.
            </p>
          </div>

          <RegisterSupplierPathOptions />
        </div>
      </main>
    </div>
  );
}