import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("bw_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userRef = useRef(user);
  userRef.current = user;

  const applyUser = (data) => {
    localStorage.setItem("bw_user", JSON.stringify(data));
    setUser(data);
  };

  // Re-fetch the logged-in user (fresh role + module permissions) and update the
  // stored session. Keeps the sidebar in sync when an admin changes access while
  // the user is logged in — no logout needed.
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("bw_token")) return;
    try {
      const { data } = await api.get("/auth/me");
      if (data?.data) {
        const current = userRef.current;
        applyUser({ ...current, ...data.data, token: undefined });
      }
    } catch {
      // network hiccup or expired token — the axios interceptor handles 401s
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("bw_token", data.data.token);
      applyUser(data.data);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bw_token");
    localStorage.removeItem("bw_user");
    setUser(null);
  }, []);

  // Face login at the register: sends the captured descriptor + GPS, stores the returned session.
  const faceLogin = useCallback(async (descriptor, gps = null) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/face-login", { descriptor, gps });
      localStorage.setItem("bw_token", data.data.token);
      applyUser(data.data);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Face login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for permission/role changes and refresh when the tab regains focus,
  // so access granted in Control shows up without logging out.
  useEffect(() => {
    if (!user) return undefined;
    const interval = setInterval(refreshUser, 15000);
    const onFocus = () => refreshUser();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?._id, refreshUser]);

  // Permission check: can(user, module, action) where action is view|create|edit|delete.
  // Mirrors backend middleware/auth.js hasPermission().
  const can = useCallback(
    (module, action = "view") => {
      if (!user) return false;
      if (user.role === "super_admin") return true;
      const perms = user.permissions;
      const empty =
        !perms || (Array.isArray(perms) ? perms.length === 0 : Object.keys(perms).length === 0);
      if (empty) return true;
      if (Array.isArray(perms)) return action === "view" && perms.includes(module);
      return !!(perms[module] && perms[module][action]);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, faceLogin, logout, loading, error, can, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
