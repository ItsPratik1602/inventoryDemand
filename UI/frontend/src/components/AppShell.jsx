import { useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories", end: true },
  { to: "/admin/inventory", label: "Inventory", end: true },
  { to: "/admin/sales", label: "Sales", end: true },
  { to: "/admin/alerts", label: "Alerts", end: true },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/rewards", label: "Rewards", end: true },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/audit", label: "Audit Logs", end: true },
  { to: "/admin/profile", label: "Profile", end: true }
];

const staffLinks = [
  { to: "/app/products", label: "Products", end: true },
  { to: "/app/profile", label: "Profile", end: true }
];

const customerLinks = [
  { to: "/products", label: "Browse Products", end: true },
  { to: "/rewards", label: "Rewards", end: true },
  { to: "/profile", label: "My Profile", end: true }
];

function AppShell({ children }) {
  const { user, logout, isAdmin, isStaff, isCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const links = useMemo(() => {
    // Determine which link set to use based on current route and user role
    if (location.pathname.startsWith('/admin')) {
      return adminLinks;
    } else if (location.pathname.startsWith('/app')) {
      if (isStaff) return staffLinks;
      if (isCustomer) return customerLinks;
    }
    // Customer routes don't start with /app, they're direct paths like /products, /cart, etc.
    else if (isCustomer && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register')) {
      return customerLinks;
    }
    // Fallback for old routes
    return isAdmin ? adminLinks : customerLinks;
  }, [location.pathname, isAdmin, isStaff, isCustomer]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const initials = useMemo(() => {
    const source = user?.name?.trim() || "User";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getLinkIcon = (label) => {
    const icons = {
      'Dashboard': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      'Users': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      'Products': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      'Categories': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      'Inventory': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      'Sales': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'Alerts': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      'Orders': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      'Rewards': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.12-3 2.5S10.343 13 12 13s3 1.12 3 2.5S13.657 18 12 18m0-10V6m0 12v-2m8-4a8 8 0 11-16 0 8 8 0 0116 0z" />
        </svg>
      ),
      'Audit Logs': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      'Profile': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      'Browse Products': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      'My Profile': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    };
    return icons[label] || (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow z-50 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            {/* Admin sidebar toggle */}
            {location.pathname.startsWith('/admin') && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {location.pathname.startsWith('/admin') ? 'Admin Portal' : 'Application'}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">
              {location.pathname.startsWith('/admin') 
                ? 'Operations Console' 
                : isStaff 
                  ? 'Staff Portal' 
                  : 'Product Catalog'
              }
            </h1>
            {location.pathname.startsWith('/admin') ? (
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {user?.role || 'ADMIN'}
              </p>
            ) : (
              <p className="text-sm text-slate-500">Welcome back, {user?.name?.split(' ')[0]}</p>
            )}
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="app-card flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-left"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="h-11 w-11 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </button>

            {menuOpen ? (
              <div className="app-card absolute right-0 top-[calc(100%+0.5rem)] z-10 min-w-44 rounded-xl bg-white p-2 shadow-lg max-h-[300px] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                <NavLink
                  to={isAdmin ? "/admin/profile" : "/app/profile"}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Profile
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile backdrop overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex">
          <aside className={`
            ${location.pathname.startsWith('/admin') ? 'h-[calc(100vh-4rem)]' : 'h-[calc(100vh-4rem)]'}
            bg-white shadow-md fixed top-16 left-0 z-40 overflow-y-auto rounded-none p-4 transition-all duration-300
            ${sidebarCollapsed && location.pathname.startsWith('/admin') ? 'w-16' : 'w-60'}
            ${menuOpen ? "fixed inset-0 z-40 lg:fixed lg:top-16 lg:left-0 lg:inset-auto" : "hidden lg:block"}
          `}>
            {/* Mobile close button */}
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h2 className="text-lg font-semibold text-[color:var(--text)]">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              {links.map((link) => (
                <NavLink
                  key={`${link.label}-${link.to}`}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => {
                    const baseClasses = "flex items-center rounded-xl text-sm font-medium transition";
                    const activeClasses = isActive ? "bg-slate-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100";
                    const collapsedClasses = location.pathname.startsWith('/admin') && sidebarCollapsed ? "justify-center px-4 py-3" : "px-4 py-3";
                    
                    return `${baseClasses} ${activeClasses} ${collapsedClasses}`;
                  }}
                >
                  {/* Always render icon */}
                  <span className={`flex-shrink-0 ${
                    location.pathname.startsWith('/admin') && sidebarCollapsed
                      ? ""
                      : "mr-3"
                  }`}>
                    {getLinkIcon(link.label)}
                  </span>
                  
                  {/* Conditionally hide text for admin collapsed sidebar */}
                  {(!location.pathname.startsWith('/admin') || !sidebarCollapsed) && (
                    <span>{link.label}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className={`
            flex-1 pt-20 px-4 bg-gray-50 min-h-screen transition-all duration-300
            ${location.pathname.startsWith('/admin') ? (sidebarCollapsed ? 'ml-16' : 'ml-60') : 'ml-60'}
          `}>
            <div className="app-page">{children}</div>
          </main>
      </div>
    </div>
  );
}

export default AppShell;
