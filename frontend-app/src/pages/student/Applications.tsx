import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import api from "../../services/api";

export default function StudentApplications() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/student/applications").then((r) => setApps(r.data));
  }, []);

  const count = (status: string) =>
    apps.filter((a) => a.application_status === status).length;

  return (
    <Layout role="student">
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="page-sub">
            Track every internship you applied to. Allocation is decided by the company AI process.
          </p>
        </div>
        <span className="badge" style={{ background: "var(--violet-soft)", color: "#5b21b6" }}>
          {apps.length} total
        </span>
      </div>

      {apps.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            You have not applied to any internships yet. Browse open internships to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="chips" style={{ marginBottom: 18 }}>
            <span className="chip" style={{ cursor: "default", background: "var(--warning-soft)", borderColor: "transparent" }}>
              {count("pending")} pending
            </span>
            <span className="chip" style={{ cursor: "default", background: "var(--success-soft)", borderColor: "transparent" }}>
              {count("allocated")} allocated
            </span>
            <span className="chip" style={{ cursor: "default", background: "var(--danger-soft)", borderColor: "transparent" }}>
              {count("not_allocated")} not allocated
            </span>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {["Internship", "Location", "Mode", "Deadline", "Post Status", "Application"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.application_id}>
                      <td style={{ fontWeight: 600, color: "var(--text)" }}>{a.title}</td>
                      <td>{a.location || "—"}</td>
                      <td style={{ textTransform: "capitalize" }}>{a.mode || "—"}</td>
                      <td>{a.application_deadline || "—"}</td>
                      <td>
                        <StatusBadge status={a.internship_status} />
                      </td>
                      <td>
                        <StatusBadge status={a.application_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
