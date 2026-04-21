import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";
import RegisterBuyerForm from "@/features/auth/components/register-buyer-form";

export default function RegisterBuyerPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <PublicAuthTopbar />

      <main className="flex min-h-screen items-center justify-center bg-surface px-6 pb-20 pt-28">
        <div className="w-full max-w-xl">
          <div className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-[0_24px_48px_-12px_rgba(25,28,30,0.06)] md:p-12">
            <div className="mb-10 text-center">
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Buat akun buyer
              </h1>
              <p className="mt-3 font-medium text-on-surface-variant">
                Lengkapi data berikut untuk memulai.
              </p>
            </div>

            <RegisterBuyerForm />
          </div>
        </div>
      </main>
    </div>
  );
}