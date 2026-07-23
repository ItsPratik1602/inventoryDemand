import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "./AppShell.jsx";

function AdminLayout() {
  const { user } = useAuth();

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default AdminLayout;
