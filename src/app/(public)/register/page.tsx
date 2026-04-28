import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";
import RegisterGatewayCards from "@/features/auth/components/register-gateway-cards";

export default function RegisterGatewayPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicAuthTopbar />

      <main className="flex min-h-screen flex-grow items-center justify-center px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28">
        <div className="w-full max-w-5xl">
          <div className="mb-8 text-center sm:mb-12">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl md:text-5xl">
              Pilih jenis akun yang ingin dibuat
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base md:text-lg md:leading-8">
              Mulai dari jalur registrasi yang paling sesuai dengan peran Anda.
            </p>
          </div>

          <RegisterGatewayCards />
        </div>
      </main>
    </div>
  );
}