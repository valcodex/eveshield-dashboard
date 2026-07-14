// Human-readable, sortable IDs shown on the dashboard (VCT-2026-0001, EMG-2026-000123)
export function generateVictimCode(sequence: number): string {
  const year = new Date().getFullYear();
  return `VCT-${year}-${String(sequence).padStart(4, "0")}`;
}

export function generateEmergencyCode(sequence: number): string {
  const year = new Date().getFullYear();
  return `EMG-${year}-${String(sequence).padStart(6, "0")}`;
}
