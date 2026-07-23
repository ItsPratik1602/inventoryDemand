import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "./AppShell.jsx";

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default AppLayout;
