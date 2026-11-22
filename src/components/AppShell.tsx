import { Link } from "@tanstack/react-router";
import { Map, Users, ShieldAlert, Shield } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Safe Map", icon: Map },
  { to: "/buddies", label: "Buddies", icon: Users },
  { to: "/sos", label: "Silent SOS", icon: ShieldAlert },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted md:py-6">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-background md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:shadow-float">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-5 py-3 backdrop-blur">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Shield className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="font-display text-xl font-bold text-foreground">SafeRoute</span>
          </Link>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-secondary-foreground">
            For her campus
          </span>
        </header>

        <main className="flex-1 pb-28">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <ul className="grid grid-cols-3 gap-1">
            {tabs.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: true }}
                  className="group flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium text-muted-foreground transition-colors data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
