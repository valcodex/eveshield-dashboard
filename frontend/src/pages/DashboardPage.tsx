import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getSocket, SOCKET_EVENTS } from "../lib/socket";
import { Emergency } from "../types";
import StatsCards from "../components/dashboard/StatsCards";
import FiltersBar, { Filters } from "../components/dashboard/FiltersBar";
import EmergencyFeed from "../components/dashboard/EmergencyFeed";
import VictimProfileCard from "../components/victim/VictimProfileCard";
import LiveLocationMap from "../components/emergency/LiveLocationMap";
import EmergencyTimeline from "../components/emergency/EmergencyTimeline";
import ResponseControls from "../components/emergency/ResponseControls";

const EMPTY_FILTERS: Filters = { search: "", status: "", priority: "", type: "" };

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: emergencies = [] } = useQuery({
    queryKey: ["emergencies", filters],
    queryFn: async () =>
      (
        await api.get<{ data: Emergency[] }>("/emergencies", {
          params: {
            search: filters.search || undefined,
            status: filters.status || undefined,
            priority: filters.priority || undefined,
            type: filters.type || undefined,
          },
        })
      ).data.data,
    refetchInterval: 20000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ["emergencies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    };
    const events = [
      SOCKET_EVENTS.NEW_EMERGENCY,
      SOCKET_EVENTS.EMERGENCY_UPDATED,
      SOCKET_EVENTS.STATUS_UPDATED,
      SOCKET_EVENTS.RESPONDER_ASSIGNED,
      SOCKET_EVENTS.LOCATION_UPDATED,
      SOCKET_EVENTS.EMERGENCY_RESOLVED,
    ];
    events.forEach((evt) => socket.on(evt, invalidateAll));
    return () => events.forEach((evt) => socket.off(evt, invalidateAll));
  }, [queryClient]);

  const selected = useMemo(() => emergencies.find((e) => e.id === selectedId) ?? null, [emergencies, selectedId]);

  return (
    <div className="space-y-6">
      <StatsCards />
      <FiltersBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="h-[70vh]">
          <EmergencyFeed emergencies={emergencies} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div>
          {selected ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <VictimProfileCard victim={selected.victim} />
              <LiveLocationMap
                location={selected.locations[0] ?? selected.victim.locations?.[0] ?? null}
                victimName={selected.victim.fullName}
              />
              <EmergencyTimeline updates={selected.updates} />
              <ResponseControls emergency={selected} />
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-panel-border text-sm text-ink-faint">
              Select an alert from the feed to view victim details, live location, and response controls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
