import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  Users,
  Ticket,
  CalendarHeart,
  MessageSquare,
  UserCog,
  CalendarClock,
  BarChart3,
  Package,
  Tv,
  Waves,
  ShieldCheck,
  Fingerprint,
  ScanFace,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin"], module: "dashboard" },
  { to: "/staff-dashboard", label: "Staff Dashboard", icon: ScanFace, roles: ["billing_staff", "entry_staff", "hr_manager"], module: null },
  { to: "/cashier-dashboard", label: "Cashier Dashboard", icon: Wallet, roles: ["cashier"], module: null },
  { to: "/billing", label: "Billing", icon: Receipt, roles: ["super_admin", "admin", "billing_staff", "cashier"], module: "billing" },
  { to: "/billing/history", label: "Bill History", icon: Receipt, roles: ["super_admin", "admin", "billing_staff", "cashier"], module: "billing_history" },
  { to: "/entry", label: "Entry Scan", icon: ScanLine, roles: ["super_admin", "admin", "entry_staff"], module: "entry" },
  { to: "/tv-display", label: "TV Display", icon: Tv, roles: null, module: "entry" },
  { to: "/customers", label: "Customer CRM", icon: Users, roles: ["super_admin", "admin", "billing_staff"], module: "customers" },
  { to: "/customers/followup", label: "Follow-up List", icon: Users, roles: ["super_admin", "admin", "billing_staff"], module: "customers" },
  { to: "/enquiries", label: "Enquiries", icon: MessageSquare, roles: ["super_admin", "admin", "billing_staff"], module: "enquiries" },
  { to: "/coupons", label: "Coupons", icon: Ticket, roles: ["super_admin", "admin", "billing_staff"], module: "coupons" },
  { to: "/bookings", label: "Party Bookings", icon: CalendarHeart, roles: null, module: "bookings" },
  { to: "/packages", label: "Packages", icon: Package, roles: ["super_admin", "admin"], module: "packages" },
  { to: "/attendance/my", label: "My Attendance", icon: CalendarClock, roles: ["admin", "billing_staff", "cashier", "entry_staff", "hr_manager"], module: "attendance" },
  { to: "/staff", label: "Staff Master", icon: UserCog, roles: ["super_admin", "admin", "hr_manager"], module: "staff" },
  { to: "/staff/attendance", label: "Attendance & Salary", icon: UserCog, roles: ["super_admin", "admin", "hr_manager"], module: "attendance" },
  { to: "/control/attendance-settings", label: "Attendance Enforcement", icon: Fingerprint, roles: ["super_admin", "admin"], module: "settings" },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["super_admin", "admin"], module: "reports" },
  { to: "/control", label: "Control", icon: ShieldCheck, roles: ["super_admin"], module: "users" },
];

const Sidebar = ({ open, onClose }) => {
  const { user, can } = useAuth();

  const visibleItems = navItems.filter(
    (item) =>
      (!item.roles || item.roles.includes(user?.role)) &&
      (!item.module || can(item.module, "view"))
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ocean-100 bg-ocean-900 text-sand-100 transition-transform duration-200 lg:relative lg:inset-auto lg:h-auto lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500">
          <Waves size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold leading-tight text-white">BlueWhale</p>
          <p className="text-[11px] uppercase tracking-wider text-ocean-300">Park Manager</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-1.5 text-ocean-300 transition hover:bg-ocean-800 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-teal-500 text-white"
                  : "text-ocean-200 hover:bg-ocean-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;