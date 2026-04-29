import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Package2,
  UserRound,
} from "lucide-react";
import type { BountyRecord } from "@/features/bounty/types";
import {
  formatDateLabel,
  getBountyClient,
  getBountyCode,
  getBountyCreatedAt,
  getBountyCreatedBy,
  getBountyDeadline,
  getBountyDescription,
  getBountyItems,
  getBountyTitle,
  getItemName,
  getItemQty,
  getRemainingLabel,
  getStatusClass,
  resolveBountyStatus,
} from "@/features/bounty/bounty-formatters";

type BountyDetailPanelProps = {
  record: BountyRecord;
  backHref: string;
  backLabel: string;
  fallbackIndex?: number;
  viewerName?: string | null;
  viewerRole?: string | null;
  sourceLabel: string;
};

export default function BountyDetailPanel({
  record,
  backHref,
  backLabel,
  fallbackIndex = 0,
  viewerName,
  viewerRole,
  sourceLabel,
}: BountyDetailPanelProps) {
  const status = resolveBountyStatus(record);
  const deadline = getBountyDeadline(record);
  const items = getBountyItems(record);

  return (
    <div className="grid gap-5 sm:gap-6">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>

      <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                  status
                )}`}
              >
                {status}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span className="break-words">{formatDateLabel(deadline)}</span>
              </span>
            </div>

            <h2 className="mt-4 break-words font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
              {getBountyTitle(record)}
            </h2>

            <p className="mt-2 break-words text-sm font-semibold text-primary">
              {getBountyClient(record)}
            </p>

            <p className="mt-4 break-words text-sm leading-7 text-on-surface-variant">
              {getBountyDescription(record)}
            </p>
          </div>

          <div className="w-full rounded-3xl bg-surface-container-low p-4 lg:w-[260px] lg:min-w-[260px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
              Summary
            </p>

            <div className="mt-4 grid gap-4">
              <SummaryLine label="Bounty Code" value={getBountyCode(record, fallbackIndex)} />
              <SummaryLine label="Requested Items" value={`${items.length}`} />
              <SummaryLine label="Deadline" value={formatDateLabel(deadline)} />
              <SummaryLine label="Remaining" value={getRemainingLabel(deadline, status)} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Package2 className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-on-surface">Requested Items</p>
        </div>

        {items.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, itemIndex) => (
              <div
                key={String(item.id ?? `${getItemName(item, itemIndex)}-${itemIndex}`)}
                className="min-w-0 rounded-2xl bg-surface-container-low p-4"
              >
                <p className="break-words text-sm font-bold text-on-surface">
                  {getItemName(item, itemIndex)}
                </p>
                <p className="mt-2 break-words text-sm text-on-surface-variant">
                  {getItemQty(item)}
                </p>
                <p className="mt-2 break-words text-xs leading-6 text-on-surface-variant">
                  {typeof item.notes === "string" && item.notes.trim()
                    ? item.notes.trim()
                    : "Tanpa catatan tambahan"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Response bounty ini belum menyertakan daftar item.
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          icon={UserRound}
          label="Viewer"
          title={viewerName || "-"}
          body={viewerRole || "-"}
        />
        <InfoCard
          icon={ClipboardList}
          label="Created By"
          title={getBountyCreatedBy(record)}
          body={`Created at: ${formatDateLabel(getBountyCreatedAt(record))}`}
        />
        <InfoCard
          icon={ClipboardList}
          label="Data Source"
          title={sourceLabel}
          body="Detail ini dibaca dari endpoint detail bounty. Jika backend belum mengirim item lengkap, komponen tetap menampilkan data yang tersedia."
        />
      </section>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-bold text-on-surface">{value}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  title,
  body,
}: {
  icon: typeof UserRound;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <article className="min-w-0 rounded-3xl bg-surface-container-lowest p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="break-words font-bold text-on-surface">{title}</p>
          <p className="mt-1 break-words text-sm leading-6 text-on-surface-variant">
            {body}
          </p>
        </div>
      </div>
    </article>
  );
}