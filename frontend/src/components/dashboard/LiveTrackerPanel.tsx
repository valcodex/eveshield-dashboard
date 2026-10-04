import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Battery, Navigation, Satellite, SignalHigh } from "lucide-react";
import { api } from "../../lib/api";

interface TrackerPacket {
  id: string;
  imei: string;
  receivedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  satellites: number | null;
  battery: number | null;
  signalStrength: number | null;
}

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LiveTrackerPanel() {
  const { data: packet } = useQuery({
    queryKey: ["tracker-latest"],
    queryFn: async () => (await api.get<{ data: TrackerPacket | null }>("/tracker/latest")).data.data,
    refetchInterval: 5000, // poll — this is a raw device feed, not Socket.IO-driven yet
  });

  if (!packet || packet.latitude === null || packet.longitude === null) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-panel-border bg-panel/70 text-xs text-ink-faint">
        Waiting for a GPS tracker packet…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-panel-border shadow-panel">
      <div className="flex items-center justify-between border-b border-panel-border bg-panel/70 px-4 py-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          Live Tracker · {packet.imei}
        </h3>
        <span className="font-mono text-[11px] text-ink-faint">
          {packet.receivedAt ? new Date(packet.receivedAt).toLocaleTimeString() : "—"}
        </span>
      </div>

      <MapContainer center={[packet.latitude, packet.longitude]} zoom={15} scrollWheelZoom style={{ height: "220px", width: "100%" }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        <Marker position={[packet.latitude, packet.longitude]} icon={markerIcon}>
          <Popup>Tracker {packet.imei}</Popup>
        </Marker>
      </MapContainer>

      <div className="grid grid-cols-4 gap-2 bg-panel/70 px-4 py-2 font-mono text-[11px] text-ink-muted">
        <span className="flex items-center gap-1">
          <Navigation size={12} /> {packet.heading ?? "—"}°
        </span>
        <span>{packet.speed ?? "—"} km/h</span>
        <span className="flex items-center gap-1">
          <Satellite size={12} /> {packet.satellites ?? "—"}
        </span>
        <span className="flex items-center gap-1">
          <Battery size={12} /> {packet.battery ?? "—"}%
        </span>
      </div>
    </div>
  );
}
