import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  role: "student" | "admin";
  children: ReactNode;
}

export default function Layout({ role, children }: LayoutProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f3" }}>
      <Sidebar role={role} />
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>{children}</main>
    </div>
  );
}
