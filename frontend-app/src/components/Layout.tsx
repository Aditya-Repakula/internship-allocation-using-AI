import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  role: "student" | "admin";
  children: ReactNode;
}

export default function Layout({ role, children }: LayoutProps) {
  return (
    <div style={s.root}>
      <Sidebar role={role} />
      <main style={s.main}>{children}</main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", minHeight: "100vh" },
  main: {
    flex: 1,
    minWidth: 0,
    padding: "32px 36px",
    background:
      "radial-gradient(1200px 400px at 80% -10%, rgba(79,70,229,0.06), transparent), var(--bg)",
  },
};
