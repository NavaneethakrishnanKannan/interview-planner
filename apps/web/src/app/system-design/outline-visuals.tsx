import { Fragment } from "react";
import type { CustomDesignOutline, ImplementationSketch } from "@/lib/system-design-custom-outline";

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function FlowArrow() {
  return (
    <div className="flex h-5 w-full shrink-0 flex-col items-center justify-center text-zinc-500" aria-hidden>
      <svg width="14" height="18" viewBox="0 0 14 18" className="text-zinc-500">
        <path
          d="M7 0.5v12M3.5 9.5L7 13l3.5-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FlowBox({
  label,
  hint,
  variant,
}: {
  label: string;
  hint?: string;
  variant: "entry" | "layer" | "storage";
}) {
  const styles =
    variant === "entry"
      ? "border-indigo-500/35 bg-indigo-950/35 ring-indigo-400/25"
      : variant === "storage"
        ? "border-amber-500/35 bg-amber-950/25 ring-amber-400/20"
        : "border-zinc-600 bg-zinc-900/85 ring-zinc-500/20";
  return (
    <div
      className={`w-full max-w-xl rounded-xl px-4 py-3 text-center shadow-sm ring-1 ${styles}`}
    >
      <p className="text-sm font-medium text-zinc-100">{truncate(label, 64)}</p>
      {hint ? <p className="mt-1 text-xs leading-snug text-zinc-500">{truncate(hint, 100)}</p> : null}
    </div>
  );
}

/** Vertical layer diagram derived from HLD block titles. */
export function OutlineHldFlow({ outline }: { outline: CustomDesignOutline }) {
  const blocks = outline.hld.blocks.slice(0, 8);

  return (
    <div className="rounded-xl border border-emerald-900/45 bg-emerald-950/20 p-5">
      <h3 className="text-sm font-semibold text-emerald-200">Visual HLD — request / data flow</h3>
      <p className="mt-1 text-xs leading-relaxed text-emerald-100/75">
        Auto-built from your outline’s HLD sections. Use it like a whiteboard starter; narrate top → bottom in the interview.
      </p>
      <div className="mt-5 flex flex-col items-center gap-0">
        <FlowBox label="Clients & experience" hint={`${outline.topicTitle} — users and devices`} variant="entry" />
        {blocks.map((b) => (
          <Fragment key={b.title}>
            <FlowArrow />
            <FlowBox label={b.title} hint={b.bullets[0]} variant="layer" />
          </Fragment>
        ))}
        <FlowArrow />
        <FlowBox label="Durable storage & backups" hint="System of record, object blobs, retention" variant="storage" />
      </div>
    </div>
  );
}

/** Horizontal strip of core entities from LLD. */
export function OutlineLldEntityRail({ outline }: { outline: CustomDesignOutline }) {
  const ents = outline.lld.entities;
  if (ents.length === 0) return null;

  return (
    <div className="rounded-xl border border-cyan-900/45 bg-cyan-950/20 p-5">
      <h3 className="text-sm font-semibold text-cyan-200">Visual LLD — core entities</h3>
      <p className="mt-1 text-xs text-cyan-100/70">Rough dependency order; adjust after you pick FKs and ownership.</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
        {ents.map((e, i) => (
          <Fragment key={e.name}>
            {i > 0 ? (
              <span className="px-1 text-cyan-600" aria-hidden>
                →
              </span>
            ) : null}
            <div className="rounded-lg border border-cyan-800/55 bg-cyan-950/45 px-3 py-2 text-center shadow-sm">
              <p className="text-xs font-semibold text-cyan-100">{e.name}</p>
              <p className="mt-1 max-w-[200px] font-mono text-[10px] leading-tight text-cyan-200/55">
                {truncate(e.fields.join(", "), 72)}
              </p>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** Chips from implementation-sketch section titles. */
export function OutlineImplementationStack({ sketch }: { sketch: ImplementationSketch }) {
  const titles = sketch.blocks.map((b) => b.title).slice(0, 8);
  if (titles.length === 0) return null;

  return (
    <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-5">
      <h3 className="text-sm font-semibold text-violet-200">Visual map — implementation areas</h3>
      <p className="mt-1 text-xs text-violet-100/75">Topics to drill in LLD; each matches a block in the sketch below.</p>
      <div className="mt-4 flex flex-col items-stretch gap-2">
        {titles.map((t, i) => (
          <div key={t} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-900/60 text-xs font-semibold text-violet-200">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-lg border border-violet-800/50 bg-violet-950/35 px-3 py-2 text-xs text-violet-100/95">
              {t}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OutlineVisualSummary({ outline }: { outline: CustomDesignOutline }) {
  return (
    <div className="space-y-4">
      <OutlineHldFlow outline={outline} />
      <div
        className={`grid gap-4 ${outline.implementationSketch ? "lg:grid-cols-2" : ""}`}
      >
        <OutlineLldEntityRail outline={outline} />
        {outline.implementationSketch ? (
          <OutlineImplementationStack sketch={outline.implementationSketch} />
        ) : null}
      </div>
    </div>
  );
}
