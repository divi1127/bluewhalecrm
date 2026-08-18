import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Waves,
  User,
  Phone,
  Package,
  Users,
  Receipt,
  ShieldCheck,
  Clock,
  Search,
  XCircle,
} from "lucide-react";
import api from "../../api/axios";

const statusMeta = {
  unused: { label: "NOT ENTERED YET", cls: "bg-teal-100 text-teal-700" },
  active: { label: "INSIDE PARK", cls: "bg-emerald-100 text-emerald-700" },
  expired: { label: "EXPIRED", cls: "bg-coral-100 text-coral-600" },
  exited: { label: "EXITED", cls: "bg-ocean-100 text-ocean-600" },
};

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

const DetailRow = ({ icon: Icon, label, value, valueClass }) => (
  <div className="flex items-center gap-3 border-b border-ocean-50 py-2.5 last:border-0">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ocean-400">{label}</p>
      <p className={`truncate text-sm font-semibold text-ocean-900 ${valueClass || ""}`}>{value}</p>
    </div>
  </div>
);

const TagLookup = () => {
  const { tagId } = useParams();
  const [params] = useSearchParams();
  const [lookup, setLookup] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fallback = useMemo(
    () => ({
      name: params.get("name") || "",
      mobile: params.get("mobile") || "",
      pkg: params.get("pkg") || "",
      guests: params.get("guests") || "",
      person: params.get("person") || "",
      bill: params.get("bill") || "",
    }),
    [params]
  );

  const load = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`/entry/status/${encodeURIComponent(id)}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Ticket not found");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tagId) load(tagId);
    else setLoading(false);
  }, [tagId]);

  const meta = data ? statusMeta[data.status] || statusMeta.unused : null;
  const customer = data?.customer || {};
  const pkg = data?.package || {};
  const bill = data?.bill || {};

  const remaining =
    data?.status === "active" && data.expiryTime
      ? Math.max(Math.floor((new Date(data.expiryTime) - new Date()) / 60000), 0)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-900 via-ocean-700 to-teal-600 p-4">
      <div className="mx-auto max-w-sm">
        <div className="mb-4 flex items-center justify-center gap-2 text-white">
          <Waves size={18} className="text-teal-300" />
          <span className="font-display text-lg font-extrabold tracking-widest">BLUEWHALE</span>
        </div>

        <div className="card">
          {loading && <p className="py-10 text-center text-sm text-ocean-400">Loading ticket details...</p>}

          {error && !loading && (
            <div className="py-6 text-center">
              <XCircle className="mx-auto mb-3 text-coral-500" size={40} />
              <p className="font-semibold text-ocean-900">Ticket not found</p>
              <p className="mt-1 text-sm text-ocean-400">{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-xs font-bold tracking-[0.2em] text-ocean-800">{data.tagId}</p>
                {meta && (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${meta.cls}`}>
                    {meta.label}
                  </span>
                )}
              </div>

              {data.status === "active" && remaining !== null && (
                <div className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                    Session valid for
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-700">{remaining} min</p>
                </div>
              )}

              <DetailRow icon={User} label="Customer" value={customer.name || fallback.name || "—"} />
              <DetailRow icon={Phone} label="Mobile" value={customer.mobile || fallback.mobile || "—"} />
              <DetailRow
                icon={Package}
                label="Package"
                value={pkg.name || fallback.pkg || "—"}
              />
              <DetailRow
                icon={Users}
                label="Guest"
                value={
                  fallback.person ||
                  fallback.guests ||
                  (data.personType
                    ? data.personType === "below5"
                      ? "Below 5 yrs"
                      : data.personType === "child"
                        ? "Child"
                        : "Adult"
                    : `${data.adults || 0}A / ${data.children || 0}C`)
                }
              />
              <DetailRow
                icon={Receipt}
                label="Bill"
                value={bill.billNumber || fallback.bill || "—"}
              />
              <DetailRow
                icon={ShieldCheck}
                label="Indoor Zone Status"
                value={data.indoorStatus ? data.indoorStatus.toUpperCase() : "UNUSED"}
                valueClass={data.indoorStatus === "exited" ? "text-coral-500" : "text-teal-600"}
              />
              <DetailRow
                icon={ShieldCheck}
                label="Outdoor Zone Status"
                value={data.outdoorStatus ? data.outdoorStatus.toUpperCase() : "UNUSED"}
                valueClass={data.outdoorStatus === "exited" ? "text-coral-500" : "text-blue-600"}
              />
              <DetailRow
                icon={ShieldCheck}
                label="First Entry Time"
                value={fmtDateTime(data.entryTime)}
              />
              <DetailRow
                icon={Clock}
                label="Expires At"
                value={fmtDateTime(data.expiryTime)}
                valueClass={data.status === "expired" ? "text-coral-500" : undefined}
              />
            </>
          )}
        </div>

        <form
          className="card mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (lookup.trim()) load(lookup.trim());
          }}
        >
          <input
            className="input-field font-mono"
            placeholder="Scan again or type Tag ID"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
          />
          <button type="submit" className="btn-accent shrink-0" aria-label="Look up tag">
            <Search size={16} />
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-teal-200/70">
          Wrist-band verification · BlueWhale Park
        </p>
      </div>
    </div>
  );
};

export default TagLookup;
