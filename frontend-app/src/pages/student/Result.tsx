import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";

export default function StudentResult() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get("/api/student/result").then((r) => setResult(r.data));
  }, []);

  if (!result) return <div style={s.loading}>Loading...</div>;

  return (
    <Layout role="student">
      <h2 style={s.heading}>My Internship Result</h2>

      {!result.allocated || !result.results_published ? (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Results Pending</h3>
          <p style={{ color: "#6b7280" }}>
            {result.message ||
              "Allocation is under process. Results will be announced by the company."}
          </p>
        </div>
      ) : (
        <>
          <div style={{ ...s.card, borderLeft: "4px solid #10b981" }}>
            <h3 style={s.cardTitle}>Allocated Internship</h3>
            <div style={s.grid}>
              {[
                ["Company", result.company_name],
                ["Role", result.internship.title],
                ["Location", result.internship.location],
                ["Mode", result.internship.mode],
                ["Duration", result.internship.duration],
                ["Status", result.allocation.status],
                ["Rank", `#${result.allocation.rank}`],
              ].map(([k, v]) => (
                <div key={k} style={s.infoItem}>
                  <span style={s.infoKey}>{k}:</span> {v || "—"}
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Match Score Breakdown</h3>
            <div style={s.overallScore}>{result.match_scores.overall}%</div>
            <div style={s.barsWrap}>
              {[
                ["Skills", result.match_scores.skills],
                ["Degree", result.match_scores.degree],
                ["Branch", result.match_scores.branch],
                ["CGPA", result.match_scores.cgpa],
                ["Location", result.match_scores.location],
                ["Sector", result.match_scores.sector],
              ].map(([label, val]) => (
                <div key={label as string} style={s.barRow}>
                  <div style={s.barLabel}>{label}</div>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${val}%` }} />
                  </div>
                  <div style={s.barVal}>{val}%</div>
                </div>
              ))}
            </div>
          </div>

          {(result.matched_skills?.length > 0 || result.missing_skills?.length > 0) && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Skills Analysis</h3>
              <div style={s.grid}>
                <div>
                  <b>Matched:</b> {(result.matched_skills || []).join(", ") || "—"}
                </div>
                <div>
                  <b>Missing:</b> {(result.missing_skills || []).join(", ") || "—"}
                </div>
              </div>
            </div>
          )}

          {result.reasons?.length > 0 && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Match Analysis</h3>
              {result.reasons.map((r: string, i: number) => (
                <div
                  key={i}
                  style={{
                    ...s.reason,
                    color: r.startsWith("✓") ? "#065f46" : "#991b1b",
                  }}
                >
                  {r}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#1a1a2e" },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a2e" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  infoItem: { fontSize: 14, color: "#374151", padding: "5px 0" },
  infoKey: { fontWeight: 600 },
  overallScore: {
    fontSize: 52,
    fontWeight: 800,
    color: "#0f766e",
    textAlign: "center",
    marginBottom: 24,
  },
  barsWrap: { display: "flex", flexDirection: "column", gap: 12 },
  barRow: { display: "flex", alignItems: "center", gap: 12 },
  barLabel: { width: 70, fontSize: 13, color: "#6b7280" },
  barTrack: { flex: 1, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", background: "#0f766e", borderRadius: 4 },
  barVal: { width: 40, fontSize: 13, fontWeight: 600, color: "#0f766e", textAlign: "right" },
  reason: { fontSize: 14, padding: "5px 0", borderBottom: "1px solid #f3f4f6" },
};
