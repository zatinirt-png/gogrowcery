import Link from "next/link";
import { Sprout } from "lucide-react";

type AppLogoProps = {
  href?: string;
  compact?: boolean;
};

export default function AppLogo({
  href = "/",
  compact = false,
}: AppLogoProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <div className="signature-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm">
        <Sprout className="h-5 w-5" />
      </div>

      <div className="flex flex-col">
        <span
          className={`font-headline font-extrabold tracking-tight text-on-surface ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          GoGrowcery
        </span>
        {!compact && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Precision Harvest
          </span>
        )}
      </div>
    </Link>
  );
}