import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MapPin, Mic, MicOff, Pencil, Phone, ShieldCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEFAULT_SECRET_PHRASE, matchesSecretPhrase } from "@/lib/sos";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "Silent SOS — SafeRoute" },
      {
        name: "description",
        content: "Say your secret phrase to silently alert your emergency contacts with your live location.",
      },
      { property: "og:title", content: "Silent SOS — SafeRoute" },
      { property: "og:description", content: "A voice-activated silent alert that shares your live GPS location." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SosPage,
});

// Minimal Web Speech API typing (not in the standard TS DOM lib).
interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognizerCtor = new () => Recognizer;

function getRecognizer(): RecognizerCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const DEMO_COORDS = { lat: 36.7172, lng: 3.1724, accuracy: 12 };

const CONTACTS = [
  { name: "Mom", detail: "+213 •• •• 12 34", delay: 900 },
  { name: "Campus Security", detail: "24/7 desk", delay: 1700 },
  { name: "Sara M. (buddy)", detail: "Verified student", delay: 2600 },
];

type Coords = { lat: number; lng: number; accuracy: number; live: boolean };

function SosPage() {
  const [phrase, setPhrase] = useState(DEFAULT_SECRET_PHRASE);
  const [draft, setDraft] = useState(DEFAULT_SECRET_PHRASE);
  const [editing, setEditing] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [alertOn, setAlertOn] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [notified, setNotified] = useState<string[]>([]);

  const phraseRef = useRef(phrase);
  phraseRef.current = phrase;
  const listeningRef = useRef(listening);
  listeningRef.current = listening;
  const cleanupAlert = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSupported(getRecognizer() !== null);
  }, []);

  const triggerAlert = useCallback(() => {
    setListening(false);
    setAlertOn(true);
    setSeconds(0);
    setNotified([]);
    setCoords(null);
    try {
      navigator.vibrate?.(60);
    } catch {
      /* ignore */
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    for (const c of CONTACTS) timers.push(setTimeout(() => setNotified((n) => [...n, c.name]), c.delay));

    let watchId: number | null = null;
    let demoTick: ReturnType<typeof setInterval> | null = null;
    const startDemo = () => {
      if (demoTick) return;
      let i = 0;
      setCoords({ ...DEMO_COORDS, live: false });
      demoTick = setInterval(() => {
        i += 1;
        setCoords({ lat: DEMO_COORDS.lat + i * 0.00004, lng: DEMO_COORDS.lng - i * 0.00003, accuracy: 10, live: false });
      }, 2000);
    };
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy), live: true }),
        startDemo,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
      );
    } else startDemo();

    cleanupAlert.current = () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (demoTick) clearInterval(demoTick);
    };
  }, []);

  useEffect(() => () => cleanupAlert.current?.(), []);

  // Speech recognition lifecycle
  useEffect(() => {
    if (!listening) return;
    const Ctor = getRecognizer();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let stopped = false;

    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i]?.[0].transcript ?? "";
      setHeard(text);
      if (matchesSecretPhrase(text, phraseRef.current)) {
        stopped = true;
        rec.stop();
        triggerAlert();
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stopped = true;
        setListening(false);
        toast.error("Microphone access is blocked", { description: "Allow the microphone to use voice activation." });
      }
    };
    rec.onend = () => {
      if (!stopped && listeningRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };
    try {
      rec.start();
    } catch {
      /* ignore */
    }
    return () => {
      stopped = true;
      rec.onend = null;
      rec.stop();
    };
  }, [listening, triggerAlert]);

  function cancelAlert() {
    cleanupAlert.current?.();
    cleanupAlert.current = null;
    setAlertOn(false);
    setHeard("");
    toast.success("Alert cancelled", { description: "Your contacts were told you're safe." });
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  if (alertOn) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-danger p-5 text-primary-foreground shadow-float">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="absolute inset-0 rounded-full bg-primary-foreground animate-sos-ping" />
              <span className="relative h-4 w-4 rounded-full bg-primary-foreground" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-wider">Silent alert active</p>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">Help is on the way</h1>
          <p className="text-sm opacity-90">No sound, no screen flash. Keep your phone with you.</p>
        </section>

        <section className="rounded-3xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Live GPS location
            </h2>
            <Badge variant={coords?.live ? "safe" : "soft"} className="rounded-full">
              {coords ? (coords.live ? "Live" : "Demo location") : "Locating…"}
            </Badge>
          </div>
          {coords ? (
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
              <div className="rounded-2xl bg-muted p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Latitude</div>
                <div className="font-semibold text-foreground">{coords.lat.toFixed(5)}</div>
              </div>
              <div className="rounded-2xl bg-muted p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Longitude</div>
                <div className="font-semibold text-foreground">{coords.lng.toFixed(5)}</div>
              </div>
              <p className="col-span-2 font-sans text-xs text-muted-foreground">Accuracy ±{coords.accuracy} m · updating continuously</p>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Getting your position…
            </p>
          )}
        </section>

        <section className="flex items-center gap-3 rounded-3xl border bg-card p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <Mic className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Audio recording</h2>
            <p className="text-xs text-muted-foreground">Recording securely · {mm}:{ss}</p>
          </div>
          <div className="flex h-8 items-center gap-0.5" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-full w-1 rounded-full bg-danger animate-wave" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4">
          <h2 className="mb-2 font-semibold text-foreground">Emergency contacts</h2>
          <ul className="divide-y">
            {CONTACTS.map((c) => {
              const done = notified.includes(c.name);
              return (
                <li key={c.name} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                  {done ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-safe-foreground">
                      <CheckCircle2 className="h-4 w-4 text-safe" /> Notified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <Button variant="safe" size="xl" className="w-full" onClick={cancelAlert}>
          <ShieldCheck /> I'm safe — cancel alert
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-4">
      <section>
        <p className="text-sm font-medium text-muted-foreground">Voice-activated, completely silent</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Silent SOS</h1>
      </section>

      <section className="rounded-3xl border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Your secret phrase</h2>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => { setDraft(phrase); setEditing(true); }}>
              <Pencil /> Change
            </Button>
          )}
        </div>
        {editing ? (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = draft.trim();
              if (v.split(/\s+/).length < 3) {
                toast.error("Use at least 3 words so it isn't triggered by accident.");
                return;
              }
              setPhrase(v);
              setEditing(false);
              toast.success("Secret phrase saved");
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="rounded-xl" autoFocus />
            <Button type="submit" variant="hero">Save</Button>
          </form>
        ) : (
          <p className="mt-2 rounded-2xl bg-primary-soft px-4 py-3 font-display text-lg font-semibold text-secondary-foreground">
            “{phrase}”
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Pick something natural you could say in any conversation.</p>
      </section>

      <section className={cn("rounded-3xl border p-5 transition-colors", listening ? "border-primary bg-primary-soft" : "bg-card")}>
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            {listening && <span className="absolute inset-0 rounded-full bg-primary/30 animate-sos-ping" />}
            <span
              className={cn(
                "relative flex h-16 w-16 items-center justify-center rounded-full",
                listening ? "bg-gradient-primary text-primary-foreground shadow-float" : "bg-muted text-muted-foreground",
              )}
            >
              {listening ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-foreground">{listening ? "Listening…" : "Listening is off"}</h2>
            <p className="text-xs text-muted-foreground">
              {listening ? "Say your phrase anytime to send a silent alert." : "Turn on before walking home."}
            </p>
          </div>
          <Switch
            checked={listening}
            disabled={supported === false}
            onCheckedChange={setListening}
            aria-label="Toggle voice listening"
          />
        </div>
        {listening && (
          <p className="mt-4 min-h-10 rounded-2xl bg-card px-3 py-2 text-sm text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Heard: </span>
            {heard || "…"}
          </p>
        )}
        {supported === false && (
          <p className="mt-3 text-xs text-danger-foreground">
            Voice activation isn't supported in this browser. Try Chrome or Edge, or use the test button below.
          </p>
        )}
      </section>

      <Button variant="sos" size="xl" className="w-full" onClick={triggerAlert}>
        <Zap /> Test silent alert
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Prototype: alerts are simulated — no real messages are sent.
      </p>
    </div>
  );
}
