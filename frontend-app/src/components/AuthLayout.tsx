import type { ReactNode } from "react";

const features: [string, string][] = [
  ["AI Resume Parsing", "Upload your PDF and skills are extracted automatically."],
  ["Smart Matching", "Semantic AI scoring of every applicant against each role."],
  ["Fair Allocation", "Stable seat-limited allocation — one student, one offer."],
  ["Transparent Results", "Score breakdowns and reasons shown once published."],
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={s.page}>
      <div style={s.brandPanel}>
        <div style={s.brand}>
          <div style={s.logoMark}>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 2.5 8.5 12 14l9.5-5.5z" />
              <path d="m6 11v4.8c0 .9 2.7 2.7 6 2.7s6-1.8 6-2.7V11" />
            </svg>
          </div>
          <div>
            <div style={s.brandName}>SmartIntern</div>
            <div style={s.brandTag}>AI-powered internship allocation</div>
          </div>
        </div>

        <div style={s.tagline}>
          <h1 style={s.title}>The right student,<br />for the right internship.</h1>
          <p style={s.sub}>
            One company. Multiple internships. An AI engine that matches students by
            skills, academics and preferences — reviewed by you before anything goes live.
          </p>
        </div>

        <div style={s.features}>
          {features.map(([t, d]) => (
            <div key={t} style={s.feature}>
              <span style={s.check}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </span>
              <div>
                <div style={s.featureTitle}>{t}</div>
                <div style={s.featureDesc}>{d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.footerNote}>B.Tech AIML Minor Project</div>
      </div>

      <div style={s.formPanel}>{children}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex" },
  brandPanel: {
    flex: "1 1 50%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "48px 56px",
    color: "#fff",
    background:
      "radial-gradient(900px 500px at 20% -10%, rgba(99,102,241,0.45), transparent), radial-gradient(700px 420px at 110% 110%, rgba(14,165,233,0.32), transparent), linear-gradient(160deg, #101a38 0%, #0f172a 60%, #172554 100%)",
    position: "relative",
    overflow: "hidden",
  },
  brand: { display: "flex", alignItems: "center", gap: 12, position: "absolute", top: 34, left: 56 },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
    boxShadow: "0 10px 26px -8px rgba(99,102,241,0.7)",
  },
  brandName: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" },
  brandTag: { fontSize: 12, color: "#94a3b8" },
  tagline: { maxWidth: 460, marginBottom: 36 },
  title: { fontSize: 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 16px" },
  sub: { fontSize: 14.5, lineHeight: 1.7, color: "#b6c2d9", margin: 0 },
  features: { display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 },
  feature: { display: "flex", gap: 12, alignItems: "flex-start" },
  check: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(16,185,129,0.2)",
    color: "#34d399",
    marginTop: 1,
  },
  featureTitle: { fontSize: 13.5, fontWeight: 600, marginBottom: 2 },
  featureDesc: { fontSize: 12.5, color: "#94a3b8", lineHeight: 1.5 },
  footerNote: { position: "absolute", bottom: 30, left: 56, fontSize: 12, color: "#64748b" },
  formPanel: {
    flex: "1 1 50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    background: "var(--bg)",
  },
};
