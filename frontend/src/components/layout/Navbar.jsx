import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin / Manager",
  billing_staff: "Billing Staff",
  entry_staff: "Entry Staff",
  hr_manager: "HR / Staff Manager",
};

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-ocean-100 bg-white px-8 py-4">
      <h1 className="text-xl font-bold text-ocean-900">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-ocean-800">{user?.name}</p>
          <p className="text-xs text-ocean-400">{roleLabels[user?.role] || user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-ocean-100 px-3 py-2 text-sm font-medium text-ocean-500 transition hover:bg-ocean-50 hover:text-coral-500"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
