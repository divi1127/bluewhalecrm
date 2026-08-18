import React from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Wrap any page that requires login. Optionally pass roles={["super_admin","admin"]}
// to also restrict by role, and module="coupons" to restrict by view permission.
const ProtectedRoute = ({ children, roles, module }) => {
  const { user, can } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-center">
        <div>
          <h2 className="text-xl font-bold text-ocean-800">Access restricted</h2>
          <p className="mt-2 text-sm text-ocean-500">Your role does not have permission to view this page.</p>
        </div>
      </div>
    );
  }
  if (module && !can(module, "view")) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-center">
        <div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <ShieldAlert size={24} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-ocean-800">Access restricted</h2>
          <p className="mt-2 text-sm text-ocean-500">
            You don't have permission to open this module. Contact your admin to update your access.
          </p>
        </div>
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
