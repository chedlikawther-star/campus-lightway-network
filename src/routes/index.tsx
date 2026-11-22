import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock,
  Lightbulb,
  Loader2,
  MessageSquareWarning,
  Navigation,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  REPORT_TYPES,
  ROUTES,
  SEED_REPORTS,
  toneFor,
  type DangerReport,
  type RouteId,
  type SafetyFactor,
} from "@/lib/safe-routes";
import { analyzeSafetyWithGemini, type SafetyAnalysis } from "@/lib/gemini.functions";

const SafeMap = lazy(() => import("@/components/SafeMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safe Map — SafeRoute" },
      {
        name: "description",
        content: "Compare the fastest and the safest walking routes from campus to home, with lighting, crowd and report scores.",
      },
      { property: "og:title", content: "Safe Map — SafeRoute" },
      {
        property: "og:description",
        content: "Pick the safest way home from university, rated by lighting, crowds and community reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SafeMapPage,
});

const factorIcon = { lighting: Lightbulb, crowd: Users, reports: MessageSquareWarning } as const;

function FactorBadge({ factor }: { factor: SafetyFactor }) {
  const Icon = factorIcon[factor.key];
  return (
    <Badge variant={toneFor(factor.value)} className="gap-1.5 rounded-full px-2.5 py-1 font-medium">
      <Icon className="h-3.5 w-3.5" />
      {factor.label}
      <span className="font-bold">{factor.value}%</span>
    </Badge>
  );
}

function MapFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-primary-soft text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading map…
    </div>
  );
}

function SafeMapPage() {
  const [selected, setSelected] = useState<RouteId>("B");
  const [reports, setReports] = useState<DangerReport[]>(SEED_REPORTS);
  const [analysis, setAnalysis] = useState<SafetyAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const route = ROUTES.find((r) => r.id === selected) ?? ROUTES[0]!;

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const hour = new Date().getHours();
      const result = await analyzeSafetyWithGemini({
        id: route.id,
        name: route.name,
        durationMin: route.durationMin,
        distanceKm: route.distanceKm,
        safetyScore: route.safetyScore,
        reportCount: route.reportCount,
        factors: route.factors.map(({ label, value, detail }) => ({ label, value, detail })),
        timeOfDay: hour >= 19 || hour < 6 ? "night" : hour >= 17 ? "evening" : "daytime",
      });
      setAnalysis(result);
    } catch {
      toast.error("Couldn't analyze this route right now.");
    } finally {
      setAnalyzing(false);
    }
  }

  function addReport(type: string) {
    const path = route.path;
    const mid = path[Math.floor(path.length / 2)] ?? path[0]!;
    const jitter = () => (Math.random() - 0.5) * 0.002;
    setReports((prev) => [
      ...prev,
      { id: `u${Date.now()}`, type, position: [mid[0] + jitter(), mid[1] + jitter()], minutesAgo: 0 },
    ]);
    toast.success("Report sent anonymously", { description: `${type} · thank you for keeping others safe.` });
  }

  return (
    <div className="space-y-5 px-4 pt-4">
      <section>
        <p className="text-sm font-medium text-muted-foreground">University → Residential Area</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Choose your way home</h1>
      </section>

      <div className="relative isolate h-72 overflow-hidden rounded-3xl border shadow-soft">
        <ClientOnly fallback={<MapFallback />}>
          <Suspense fallback={<MapFallback />}>
            <SafeMap selected={selected} reports={reports} onSelect={(id) => { setSelected(id); setAnalysis(null); }} />
          </Suspense>
        </ClientOnly>
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-caution-foreground shadow-soft">
            <span className="h-2 w-4 rounded-full bg-caution" /> Fastest
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-safe-foreground shadow-soft">
            <span className="h-2 w-4 rounded-full bg-safe" /> Safest
          </span>
        </div>
      </div>

      <section className="space-y-3" aria-label="Route options">
        {ROUTES.map((r) => {
          const active = r.id === selected;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => { setSelected(r.id); setAnalysis(null); }}
              className={cn(
                "w-full rounded-3xl border-2 bg-card p-4 text-left transition-all",
                active
                  ? r.tone === "safe"
                    ? "border-safe shadow-soft"
                    : "border-caution shadow-soft"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
              aria-pressed={active}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-full", r.tone === "safe" ? "bg-safe" : "bg-caution")} />
                    <h2 className="font-display text-lg font-bold text-foreground">{r.name}</h2>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {r.durationMin} mins · {r.distanceKm} km
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-1.5 text-center",
                    r.tone === "safe" ? "bg-safe-soft text-safe-foreground" : "bg-caution-soft text-caution-foreground",
                  )}
                >
                  <div className="font-display text-xl font-extrabold leading-none">{r.safetyScore}%</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide">Safe</div>
                </div>
              </div>
              {active && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {r.factors.map((f) => (
                      <FactorBadge key={f.key} factor={f} />
                    ))}
                  </div>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {r.factors.map((f) => (
                      <li key={f.key}>• {f.detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </button>
          );
        })}
      </section>

      <section className="rounded-3xl bg-gradient-hero p-4 text-primary-foreground shadow-float">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> AI safety check
            </p>
            <p className="text-xs opacity-85">Get a quick read on {route.name.split(":")[0]}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={runAnalysis} disabled={analyzing} className="rounded-full">
            {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {analyzing ? "Analyzing" : "Analyze"}
          </Button>
        </div>
        {analysis && (
          <div className="mt-3 space-y-2 rounded-2xl bg-card p-3 text-sm text-card-foreground">
            <div className="flex items-center justify-between">
              <Badge variant={analysis.riskLevel === "low" ? "safe" : analysis.riskLevel === "medium" ? "caution" : "danger"} className="rounded-full capitalize">
                {analysis.riskLevel} risk
              </Badge>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {analysis.source === "gemini" ? "Gemini" : "Demo insight"}
              </span>
            </div>
            <p>{analysis.summary}</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {analysis.tips.map((t) => (
                <li key={t} className="flex gap-1.5"><Navigation className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{t}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <ReportDialog onSubmit={addReport} />
    </div>
  );
}

function ReportDialog({ onSubmit }: { onSubmit: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>(REPORT_TYPES[0]);
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="sos" size="xl" className="w-full">
          <AlertTriangle /> Report danger here
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Quick danger report</DialogTitle>
          <DialogDescription>Anonymous. It's pinned on your selected route for other students.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                type === t ? "border-danger bg-danger-soft text-danger-foreground" : "bg-card text-foreground hover:bg-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional: what happened? (no names needed)"
          className="rounded-2xl"
        />
        <DialogFooter>
          <Button
            variant="sos"
            size="xl"
            className="w-full"
            onClick={() => {
              onSubmit(type);
              setNote("");
              setOpen(false);
            }}
          >
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
