import PublicAuthTopbar from "@/features/auth/components/public-auth-topbar";
import RegisterGatewayCards from "@/features/auth/components/register-gateway-cards";

export default function RegisterGatewayPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicAuthTopbar />

      <main className="flex min-h-screen flex-grow items-center justify-center px-6 pb-12 pt-28">
        <div className="w-full max-w-5xl">
          <div className="mb-12 text-center">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Pilih jenis akun yang ingin dibuat
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-on-surface-variant md:text-lg">
              Mulai dari jalur registrasi yang paling sesuai dengan peran Anda.
            </p>
          </div>

          <RegisterGatewayCards />
        </div>
      </main>
    </div>
  );
}