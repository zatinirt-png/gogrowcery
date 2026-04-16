import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CircleHelp,
  FileText,
  Home,
  Hourglass,
  Mail,
  Phone,
  Route,
} from "lucide-react";

export default function RegisterSupplierAdminCompletePage() {
  const applicationId = "PH-PENDING";

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-on-background">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-full items-center justify-between px-6 py-4">
          <div className="font-headline text-xl font-bold tracking-tight text-green-800">
            The Precision Harvest
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-8 text-sm tracking-tight md:flex">
              <a
                href="#"
                className="text-slate-500 transition-colors hover:text-green-600"
              >
                Marketplace
              </a>
              <a
                href="#"
                className="text-slate-500 transition-colors hover:text-green-600"
              >
                Resources
              </a>
              <a
                href="#"
                className="text-slate-500 transition-colors hover:text-green-600"
              >
                Community
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-slate-500 transition-colors hover:text-green-700"
              >
                <CircleHelp className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="text-slate-500 transition-colors hover:text-green-700"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="h-8 w-8 rounded-full border border-surface-container-high bg-surface-container-low" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-grow items-center justify-center p-6 md:p-12">
        <div className="grid w-full max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <section className="flex flex-col gap-8 lg:col-span-7">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-container/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-primary-container">
                <BadgeCheck className="h-4 w-4" />
                Submission Successful
              </span>

              <h1 className="font-headline text-5xl font-extrabold leading-tight tracking-tight text-on-surface">
                Registration Submitted.
              </h1>

              <p className="max-w-2xl text-xl leading-relaxed text-on-surface-variant">
                Application received. Your journey to join our supplier network
                has begun. We are currently verifying your credentials and
                onboarding submission.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Review Status
                  </span>
                  <Hourglass className="h-5 w-5 text-primary" />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-headline text-lg font-bold">
                    Pending Review
                  </h3>
                  <p className="text-sm text-secondary">
                    Our compliance team is verifying your land records and
                    business information.
                  </p>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Quality Check
                  </span>
                  <FileText className="h-5 w-5 text-tertiary" />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-headline text-lg font-bold">
                    Waiting for Survey
                  </h3>
                  <p className="text-sm text-secondary">
                    A digital sustainability survey will be sent to your
                    registered email within 24 hours.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-tertiary">
                  <span className="text-base">!</span>
                  Action Required Soon
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-xl bg-surface-container-low p-8">
              <h2 className="font-headline flex items-center gap-2 text-xl font-bold">
                <Route className="h-5 w-5 text-primary" />
                The Roadmap to Activation
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      1
                    </div>
                    <div className="mt-2 h-full w-px bg-outline-variant/30" />
                  </div>

                  <div className="pb-2">
                    <h4 className="font-bold text-on-surface">
                      Compliance Audit
                    </h4>
                    <p className="text-sm text-secondary">
                      Our team reviews your submitted land and payout data for
                      accuracy. (2-3 business days)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest text-sm font-bold text-on-surface-variant">
                      2
                    </div>
                    <div className="mt-2 h-full w-px bg-outline-variant/30" />
                  </div>

                  <div className="pb-2">
                    <h4 className="font-bold text-on-surface">
                      Digital Survey Completion
                    </h4>
                    <p className="text-sm text-secondary">
                      Complete the sustainability questionnaire sent to your
                      inbox to continue activation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest text-sm font-bold text-on-surface-variant">
                      3
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-on-surface">
                      Official Onboarding Call
                    </h4>
                    <p className="text-sm text-secondary">
                      Final discussion with the regional manager regarding
                      logistics and activation readiness.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/"
                className="signature-gradient flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Home className="h-4 w-4" />
                Return to home
              </Link>

              <Link
                href="/register/supplier/admin/step-5"
                className="rounded-xl bg-surface-container-high px-8 py-3.5 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-highest active:scale-95"
              >
                View Application Copy
              </Link>
            </div>
          </section>

          <aside className="sticky top-28 flex flex-col gap-6 lg:col-span-5">
            <div className="group relative aspect-video overflow-hidden rounded-xl shadow-xl">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBf1fGyJUMmn-LXgGPW6A3vxSXrcZ-25ymr4Tp-B4Uk1K05LqHG3Bdc0vfbJYf-VLE1MHu5yErvZ4r2OYF9gXf00CXbw9VtuDAAAeEb0OVyPcbEwX8y5nU605jZ-P2E2RcG7pRzqZx4hka7ASeEeeFIBRl75-qxWkFsDKE0WVUyMHbpEgrxa8fxQQRhlNLu94ic8bkD1_wt73uA_-uS9YqKyDq4hPj8HbQBYx-PEF3gy37UlKvxb2vbjUM-H41jRPfNBxsmZPrg3Sw"
                alt="Lush greenhouse"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
                <p className="text-sm font-medium italic text-white">
                  "Cultivating the future of precision agriculture, one
                  partnership at a time."
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-xl border border-outline-variant/10 bg-surface-container-highest/40 p-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-headline text-lg font-bold">
                  Need Assistance?
                </h3>
                <p className="text-sm text-secondary">
                  Our supplier support team is available to help through the
                  onboarding process.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                      Email Support
                    </p>
                    <p className="font-semibold text-primary">
                      suppliers@precisionharvest.com
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-lg border border-outline-variant/5 bg-surface-container-lowest p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                      Direct Line
                    </p>
                    <p className="font-semibold text-primary">
                      +1 (800) GROW-NOW
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant/10 pt-4">
                <p className="text-xs leading-relaxed text-secondary">
                  For urgent inquiries regarding land disputes or banking
                  details, please have your{" "}
                  <span className="font-bold">
                    Application ID: #{applicationId}
                  </span>{" "}
                  ready.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-r-xl border-l-4 border-primary bg-primary/5 p-6">
              <h4 className="font-headline text-sm font-bold">
                The Precision Promise
              </h4>
              <p className="text-xs leading-relaxed text-secondary">
                We respect your time. Most supplier applications can be
                processed quickly once documents and survey flow are complete.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-auto border-t border-outline-variant/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs font-medium tracking-tight text-secondary md:flex-row">
          <div className="flex gap-8">
            <a href="#" className="transition-colors hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Supplier Agreement
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Digital Ethics
            </a>
          </div>

          <div className="text-on-surface-variant/60">
            © 2026 The Precision Harvest. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}