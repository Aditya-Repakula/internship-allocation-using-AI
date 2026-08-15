import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import api from "../../services/api";

export default function StudentResult() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get("/api/student/result").then((r) => setResult(r.data));
  }, []);

  if (!result)
    return (
      <div className="loading">
        <div className="spinner" /> Loading result...
      </div>
    );

  const published = result.allocated && result.results_published;
  const rejected = result.status === "not_allocated";

  return (
    <Layout role="student">
      <div style={{ marginBottom: 22 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          My Internship Result
        </h1>
        <p className="page-sub">Your final allocation, decided by the AI matching engine.</p>
      </div>

      {!published && !rejected ? (
        <div className="card">
          <h2 className="card-title">Results Pending</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            {result.message ||
              "Allocation is under process. Results will be announced by the company."}
          </p>
        </div>
      ) : rejected ? (
        <div className="card" style={{ borderLeft: "4px solid var(--danger)", marginBottom: 20 }}>
          <div className="row-between" style={{ marginBottom: 18 }}>
            <h2 className="card-title" style={{ fontSize: 17 }}>Not Allocated</h2>
            <StatusBadge status="not_allocated" />
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            {result.message}
          </p>
          {result.internship && (
            <div style={s.grid}>
              {[
                ["Role", result.internship.title],
                ["Location", result.internship.location],
                ["Mode", result.internship.mode],
                ["Duration", result.internship.duration],
                ["Sector", result.internship.sector],
              ].map(([k, v]) => (
                <div key={k} style={s.infoItem}>
                  <div style={s.infoKey}>{k}</div>
                  <div style={s.infoVal}>{v || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ borderLeft: "4px solid var(--success)", marginBottom: 20 }}>
            <div className="row-between" style={{ marginBottom: 18 }}>
              <h2 className="card-title" style={{ fontSize: 17 }}>Allocated Internship</h2>
              <StatusBadge status="allocated" />
            </div>
            <div style={s.grid}>
              {[
                ["Company", result.company_name],
                ["Role", result.internship.title],
                ["Location", result.internship.location],
                ["Mode", result.internship.mode],
                ["Duration", result.internship.duration],
                ["Sector", result.internship.sector],
                ["Your Rank", `#${result.allocation.rank}`],
                ["Status", result.allocation.status],
              ].map(([k, v]) => (
                <div key={k} style={s.infoItem}>
                  <div style={s.infoKey}>{k}</div>
                  <div style={s.infoVal}>{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="row-between" style={{ marginBottom: 20 }}>
              <h2 className="card-title">Match Score Breakdown</h2>
              <div style={s.overall}>
                {result.match_scores.overall}
                <span style={{ fontSize: 18, fontWeight: 600 }}>%</span>
              </div>
            </div>
            <div style={s.bars}>
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
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="card-title">Skills Analysis</h2>
              <div style={s.twoCol}>
                <div>
                  <div style={s.skillLabel}>Matched</div>
                  <div className="tags">
                    {(result.matched_skills || []).length ? (
                      (result.matched_skills as string[]).map((sk) => (
                        <span key={sk} className="tag" style={{ background: "var(--success-soft)", color: "#065f46" }}>
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="muted small">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={s.skillLabel}>Missing</div>
                  <div className="tags">
                    {(result.missing_skills || []).length ? (
                      (result.missing_skills as string[]).map((sk) => (
                        <span key={sk} className="tag" style={{ background: "var(--danger-soft)", color: "#b91c1c" }}>
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="muted small">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.reasons?.length > 0 && (
            <div className="card">
              <h2 className="card-title">Match Analysis</h2>
              <div style={s.reasons}>
                {result.reasons.map((r: string, i: number) => (
                  <div
                    key={i}
                    style={{
                      ...s.reason,
                      color: r.startsWith("✓") ? "var(--accent-strong)" : "#991b1b",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                        background: r.startsWith("✓") ? "var(--success-soft)" : "var(--danger-soft)",
                      }}
                    >
                      {r.startsWith("✓") ? "✓" : "✗"}
                    </span>
                    {r.slice(1).trim()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  infoItem: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
  },
  infoKey: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-3)",
    marginBottom: 2,
  },
  infoVal: { fontSize: 14, fontWeight: 600, color: "var(--text)", textTransform: "capitalize" },
  overall: {
    fontSize: 40,
    fontWeight: 800,
    color: "var(--accent)",
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  bars: { display: "flex", flexDirection: "column", gap: 14 },
  barRow: { display: "flex", alignItems: "center", gap: 12 },
  barLabel: { width: 72, fontSize: 13, color: "var(--text-2)", fontWeight: 500 },
  barTrack: { flex: 1, height: 9, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #0d9488, #14b8a6)", transition: "width 0.5s ease" },
  barVal: { width: 44, fontSize: 13, fontWeight: 700, color: "var(--accent)", textAlign: "right" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  skillLabel: { fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 },
  reasons: { display: "flex", flexDirection: "column", gap: 8 },
  reason: { display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, padding: "8px 12px", borderRadius: 10, background: "var(--surface-2)" },
};
