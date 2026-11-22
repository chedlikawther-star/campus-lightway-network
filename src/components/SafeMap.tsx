// Browser-only: imports Leaflet. Load via React.lazy behind <ClientOnly>.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  RESIDENCE,
  ROUTES,
  UNIVERSITY,
  type DangerReport,
  type RouteId,
} from "@/lib/safe-routes";

interface Props {
  selected: RouteId;
  reports: DangerReport[];
  onSelect: (id: RouteId) => void;
}

function pin(label: string, cls: string, size = 34) {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin ${cls}">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function SafeMap({ selected, reports, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const linesRef = useRef<Partial<Record<RouteId, L.Polyline>>>({});
  const reportLayer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { zoomControl: false, attributionControl: true });
    mapRef.current = map;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);

    for (const r of ROUTES) {
      const line = L.polyline(r.path, { className: r.lineClass, weight: 6, opacity: 0.9 })
        .addTo(map)
        .bindTooltip(`${r.name} · ${r.durationMin} min · ${r.safetyScore}% safe`, { sticky: true });
      line.on("click", () => onSelectRef.current(r.id));
      linesRef.current[r.id] = line;
    }

    L.marker(UNIVERSITY, { icon: pin("U", "map-pin-primary") })
      .addTo(map)
      .bindPopup("<b>University</b><br/>Main gate");
    L.marker(RESIDENCE, { icon: pin("R", "map-pin-primary") })
      .addTo(map)
      .bindPopup("<b>Residential Area</b><br/>Student housing");

    reportLayer.current = L.layerGroup().addTo(map);
    map.fitBounds(L.latLngBounds(ROUTES.flatMap((r) => r.path)), { padding: [28, 28] });

    return () => {
      map.remove();
      mapRef.current = null;
      linesRef.current = {};
    };
  }, []);

  useEffect(() => {
    for (const r of ROUTES) {
      const line = linesRef.current[r.id];
      if (!line) continue;
      const active = r.id === selected;
      line.setStyle({ weight: active ? 8 : 5, opacity: active ? 1 : 0.45 });
      if (active) line.bringToFront();
    }
  }, [selected]);

  useEffect(() => {
    const layer = reportLayer.current;
    if (!layer) return;
    layer.clearLayers();
    for (const rep of reports) {
      L.marker(rep.position, { icon: pin("!", "map-pin-danger", 26) })
        .addTo(layer)
        .bindPopup(
          `<b>${rep.type}</b><br/>${rep.minutesAgo < 1 ? "Just now" : rep.minutesAgo < 60 ? `${rep.minutesAgo} min ago` : `${Math.round(rep.minutesAgo / 60)} h ago`}`,
        );
    }
  }, [reports]);

  return <div ref={el} className="h-full w-full" aria-label="Safe route map" />;
}
