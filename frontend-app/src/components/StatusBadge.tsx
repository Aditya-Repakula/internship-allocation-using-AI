const map: Record<string, { bg: string; fg: string; label?: string }> = {
  draft: { bg: "var(--surface-2)", fg: "var(--text-2)", label: "Draft" },
  open: { bg: "var(--success-soft)", fg: "#065f46", label: "Open" },
  closed: { bg: "var(--warning-soft)", fg: "#92400e", label: "Closed" },
  allocating: { bg: "var(--info-soft)", fg: "#1e40af", label: "Allocating" },
  allocated: { bg: "var(--violet-soft)", fg: "#5b21b6", label: "Allocated" },
  results_published: { bg: "var(--success-soft)", fg: "#065f46", label: "Published" },
  pending: { bg: "var(--info-soft)", fg: "#1e40af", label: "Pending" },
  withdrawn: { bg: "var(--surface-2)", fg: "var(--text-2)", label: "Withdrawn" },
  not_allocated: { bg: "var(--danger-soft)", fg: "#b91c1c", label: "Not Allocated" },
  uploaded: { bg: "var(--info-soft)", fg: "#1e40af", label: "Uploaded" },
  parsed: { bg: "var(--warning-soft)", fg: "#92400e", label: "Parsed" },
  confirmed: { bg: "var(--success-soft)", fg: "#065f46", label: "Confirmed" },
  not_uploaded: { bg: "var(--surface-2)", fg: "var(--text-3)", label: "Not Uploaded" },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = map[status] || { bg: "var(--surface-2)", fg: "var(--text-2)", label: status };
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}
