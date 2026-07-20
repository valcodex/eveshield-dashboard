import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { api } from "../../lib/api";

// A small set of sample victims/locations so repeated clicks produce
// varied, realistic-looking demo alerts instead of one identical case.
const DEMO_SCENARIOS = [
  {
    victim: { fullName: "Wanjiku Njoroge", phoneNumber: "+254712000111", gender: "Female", age: 24, bloodGroup: "O+" },
    type: "POLICE",
    priority: "CRITICAL",
    region: "Nairobi",
    latitude: -1.2864 + (Math.random() - 0.5) * 0.02,
    longitude: 36.8172 + (Math.random() - 0.5) * 0.02,
  },
  {
    victim: { fullName: "David Kiptoo", phoneNumber: "+254733000222", gender: "Male", age: 31, bloodGroup: "A-" },
    type: "MEDICAL",
    priority: "HIGH",
    region: "Nairobi",
    latitude: -1.292 + (Math.random() - 0.5) * 0.02,
    longitude: 36.821 + (Math.random() - 0.5) * 0.02,
  },
  {
    victim: { fullName: "Amina Hassan", phoneNumber: "+254799000333", gender: "Female", age: 19, bloodGroup: "B+" },
    type: "GENERAL",
    priority: "MEDIUM",
    region: "Mombasa",
    latitude: -4.0435 + (Math.random() - 0.5) * 0.02,
    longitude: 39.6682 + (Math.random() - 0.5) * 0.02,
  },
];

export default function DemoAlertButton() {
  const queryClient = useQueryClient();

  const trigger = useMutation({
    mutationFn: () => {
      const scenario = DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)];
      return api.post("/emergencies", scenario);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergencies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  return (
    <button
      onClick={() => trigger.mutate()}
      disabled={trigger.isPending}
      className="flex items-center gap-2 rounded-md border border-crimson/40 bg-crimson-soft px-3 py-2 text-xs font-semibold text-crimson-bright transition hover:bg-crimson/20 disabled:opacity-50"
      title="For demo purposes only — simulates a panic-button alert from the mobile app"
    >
      <Radio size={14} className={trigger.isPending ? "animate-pulse" : ""} />
      {trigger.isPending ? "Sending alert…" : "Simulate Panic Alert"}
    </button>
  );
}
