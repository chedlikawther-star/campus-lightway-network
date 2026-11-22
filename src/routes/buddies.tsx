import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Check, Clock, GraduationCap, IdCard, Loader2, Lock, MapPin, ScanLine, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buddies")({
  head: () => ({
    meta: [
      { title: "Commute Buddies — SafeRoute" },
      {
        name: "description",
        content: "Verify your student ID and walk to campus with verified female students heading the same way.",
      },
      { property: "og:title", content: "Commute Buddies — SafeRoute" },
      { property: "og:description", content: "Find verified female students nearby going to your university." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuddiesPage,
});

type Stage = "idle" | "scanning" | "verified";

const BUDDIES = [
  { id: 1, name: "Amira B.", faculty: "Computer Science · L3", distance: "250 m", leaves: "08:10", rating: 4.9, walks: 42 },
  { id: 2, name: "Lina K.", faculty: "Medicine · Year 2", distance: "400 m", leaves: "08:15", rating: 4.8, walks: 27 },
  { id: 3, name: "Sara M.", faculty: "Architecture · M1", distance: "650 m", leaves: "08:20", rating: 5.0, walks: 63 },
  { id: 4, name: "Yasmine H.", faculty: "Economics · L2", distance: "900 m", leaves: "08:30", rating: 4.7, walks: 15 },
];

function BuddiesPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [requested, setRequested] = useState<number[]>([]);
  const verified = stage === "verified";

  function startScan() {
    setStage("scanning");
    setProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        setStage("verified");
        toast.success("Student ID verified", { description: "You can now request commute buddies." });
      }
    }, 300);
  }

  return (
    <div className="space-y-5 px-4 pt-4">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Never walk alone</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Commute Buddies</h1>
      </section>

      <section
        className={cn(
          "rounded-3xl border p-5 transition-colors",
          verified ? "border-safe bg-safe-soft" : "bg-card shadow-soft",
        )}
      >
        {stage !== "verified" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <IdCard className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Verify your student ID</h2>
                <p className="text-sm text-muted-foreground">
                  We scan your card to confirm you're a female student here. Only verified students see each other.
                </p>
              </div>
            </div>
            {stage === "scanning" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <ScanLine className="h-4 w-4 animate-pulse" /> Reading name, faculty and student number…
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            <Button variant="hero" size="xl" className="w-full" onClick={startScan} disabled={stage === "scanning"}>
              {stage === "scanning" ? <Loader2 className="animate-spin" /> : <ScanLine />}
              {stage === "scanning" ? "Scanning ID…" : "Upload student ID"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-safe text-primary-foreground">
              <BadgeCheck className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <Badge variant="safe" className="mb-1 gap-1 rounded-full bg-card">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified Student
              </Badge>
              <p className="text-sm font-semibold text-foreground">Kawther H. · Faculty of Science</p>
              <p className="text-xs text-muted-foreground">Student ID •••• 4821 · valid until June 2027</p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Going to University now</h2>
          <span className="text-xs font-medium text-muted-foreground">{BUDDIES.length} nearby</span>
        </div>

        {BUDDIES.map((b) => {
          const isRequested = requested.includes(b.id);
          return (
            <article key={b.id} className="flex items-center gap-3 rounded-3xl border bg-card p-3.5">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary font-display text-base font-bold text-primary-foreground">
                  {b.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-card text-safe" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className={cn("font-semibold text-foreground", !verified && "blur-[3px] select-none")}>{b.name}</h3>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-caution text-caution" /> {b.rating}
                  </span>
                </div>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <GraduationCap className="h-3 w-3" /> {b.faculty}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{b.distance}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />Leaves {b.leaves}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant={isRequested ? "soft" : "hero"}
                className="rounded-full"
                disabled={!verified || isRequested}
                onClick={() => {
                  setRequested((r) => [...r, b.id]);
                  toast.success(`Buddy request sent to ${b.name}`, { description: `Meet-up point: University main gate, ${b.leaves}` });
                }}
              >
                {!verified ? <Lock /> : isRequested ? <Check /> : null}
                {isRequested ? "Requested" : "Request Buddy"}
              </Button>
            </article>
          );
        })}
        {!verified && (
          <p className="text-center text-xs text-muted-foreground">Verify your student ID to see names and send requests.</p>
        )}
      </section>
    </div>
  );
}
