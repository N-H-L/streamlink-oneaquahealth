import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  code: string;
  name: string;
  lat: number;
  lon: number;
  score: number | null; // 0–1 priority, null = unknown
  highlight?: boolean;
  label?: string;
}

export function priorityColor(score: number | null): string {
  if (score === null) return "#8a99a6";
  if (score >= 0.6) return "#c0392b";
  if (score >= 0.45) return "#e08a1e";
  if (score >= 0.3) return "#d4b106";
  return "#2e8b57";
}

export function SiteMap({ points, center, zoom = 12, onSelect, onHover, height = 380, you }: {
  points: MapPoint[];
  center: [number, number];
  zoom?: number;
  onSelect?: (code: string) => void;
  onHover?: (code: string | null) => void;
  height?: number | string;
  you?: { lat: number; lon: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView(center, zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: "tiles-muted",
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    map.current?.setView(center, zoom);
  }, [center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const p of points) {
      const m = L.circleMarker([p.lat, p.lon], {
        radius: p.highlight ? 11 : 8,
        color: p.highlight ? "#0b2530" : "#ffffff",
        weight: p.highlight ? 3 : 2,
        fillColor: priorityColor(p.score),
        fillOpacity: 0.95,
      });
      m.bindTooltip(`${p.name}${p.label ? ` · ${p.label}` : ""}`, { direction: "top", offset: [0, -6] });
      if (onSelect) m.on("click", () => onSelect(p.code));
      if (onHover) {
        m.on("mouseover", () => onHover(p.code));
        m.on("mouseout", () => onHover(null));
      }
      m.addTo(g);
    }
    if (you) L.circleMarker([you.lat, you.lon], { radius: 6, color: "#1f6feb", fillColor: "#1f6feb", fillOpacity: 1 }).bindTooltip("You").addTo(g);
  }, [points, you, onSelect, onHover]);

  return <div ref={el} className="map" style={{ height }} role="region" aria-label="Map of stream sites" />;
}
