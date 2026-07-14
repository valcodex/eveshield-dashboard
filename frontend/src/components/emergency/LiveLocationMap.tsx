import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { formatDistanceToNow } from "date-fns";
import L from "leaflet";
import { Location } from "../../types";

// Default Leaflet marker icons reference bundled images that Vite doesn't
// resolve automatically — point them at a CDN so the pin always renders.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LiveLocationMap({ location, victimName }: { location: Location | null; victimName: string }) {
  if (!location) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-panel-border bg-panel/70 text-xs text-ink-faint">
        No GPS location reported yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-panel-border shadow-panel">
      <div className="flex items-center justify-between border-b border-panel-border bg-panel/70 px-4 py-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Live Location</h3>
        <span className="font-mono text-[11px] text-ink-faint">
          Updated {formatDistanceToNow(new Date(location.recordedAt), { addSuffix: true })}
        </span>
      </div>
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={15}
        scrollWheelZoom
        style={{ height: "260px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        <Marker position={[location.latitude, location.longitude]} icon={markerIcon}>
          <Popup>{victimName}</Popup>
        </Marker>
      </MapContainer>
      <div className="flex justify-between bg-panel/70 px-4 py-2 font-mono text-[11px] text-ink-muted">
        <span>Lat {location.latitude.toFixed(5)}</span>
        <span>Lng {location.longitude.toFixed(5)}</span>
      </div>
    </div>
  );
}
