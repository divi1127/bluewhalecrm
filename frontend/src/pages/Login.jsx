import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, LogIn, ScanFace } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const homeByRole = (role) =>
  role === "cashier" ? "/cashier-dashboard"
  : ["billing_staff", "entry_staff", "hr_manager"].includes(role) ? "/staff-dashboard"
  : "/dashboard";

const Login = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      navigate(homeByRole(data.role), { replace: true });
    } catch {
      // error is already surfaced via useAuth().error
    }
  };

  return (
    <div className="flex min-h-screen bg-ocean-950">
      {/* Left side: Image */}
      <div className="relative hidden w-1/2 lg:block">
        <img 
          src="/images/login-bg.png" 
          alt="Gaming Arcade" 
          className="absolute inset-0 h-full w-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/20 to-ocean-950"></div>
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Step Into the Future of Gaming.</h2>
          <p className="text-lg text-ocean-200">Manage your theme park operations seamlessly with BlueWhale's advanced operating system.</p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex w-full items-center justify-center lg:w-1/2 px-4 sm:px-12 lg:px-24">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-xl shadow-teal-500/20">
              <Waves size={32} className="text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white">BlueWhale</h1>
            <p className="text-sm text-ocean-300 mt-2">Welcome back! Please login to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="card bg-ocean-900/50 border border-ocean-800 backdrop-blur-md shadow-2xl space-y-5 p-8">
            <div>
              <label className="label text-ocean-200">Login ID / Email</label>
              <input
                required
                className="input-field bg-ocean-950/50 border-ocean-700 text-white placeholder-ocean-500 focus:border-teal-500 focus:ring-teal-500/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bluewhale.local or STF0001"
              />
            </div>
            <div>
              <label className="label text-ocean-200">Password</label>
              <input
                type="password"
                required
                className="input-field bg-ocean-950/50 border-ocean-700 text-white placeholder-ocean-500 focus:border-teal-500 focus:ring-teal-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm font-medium text-coral-500">{error}</p>}

            <button type="submit" disabled={loading} className="btn-accent w-full py-3 shadow-lg shadow-teal-500/20">
              <LogIn size={18} />
              {loading ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/face-login"
              className="inline-flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-6 py-3 text-sm font-bold text-teal-400 transition hover:bg-teal-500 hover:text-white hover:border-teal-500"
            >
              <ScanFace size={18} /> Staff / Cashier — Face Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
