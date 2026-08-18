import React, { useEffect, useState } from "react";
import { LogIn, LogOut, IndianRupee, AlertTriangle, Download, Calculator, ScanFace, Plus, XCircle, Clock, CheckCircle2, AlertCircle, X, KeyRound } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import FaceCapture from "../../components/common/FaceCapture";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const statusColors = { present: "green", absent: "red", "half-day": "amber", leave: "gray", late: "amber" };
const today = () => new Date().toISOString().slice(0, 10);

const getPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });

const Attendance = () => {
  const { can } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [month, setMonth] = useState(today().slice(0, 7));
  const [salary, setSalary] = useState(null);
  const [settings, setSettings] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // {scope, staffId, gps}
  const [note, setNote] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);

  const canCreate = can("attendance", "create");

  const loadRecords = () => api.get("/attendance", { params: { from: today(), to: today() } }).then(({ data }) => setRecords(data.data));

  useEffect(() => {
    api.get("/staff?active=true").then(({ data }) => setStaffList(data.data));
    loadRecords();
    api.get("/settings/attendance").then(({ data }) => setSettings(data.data)).catch(() => setSettings(null));
  }, []);

  const faceRequiredFor = (scope) =>
    settings?.faceVerification?.method === "photo_capture_store" &&
    (settings.faceVerification.enforcedOn || []).includes(scope);

  const runAction = async (scope, staffId, facePhoto, gps) => {
    const payload = {};
    if (facePhoto) payload.facePhoto = facePhoto;
    if (gps) payload.gps = gps;
    await api.post(scope === "checkin" ? "/attendance/checkin" : "/attendance/checkout", { staffId, ...payload });
    setPendingAction(null);
    loadRecords();
  };

  const handleAction = async (scope, staffId) => {
    const gps = await getPosition();
    const mode = settings?.gps?.enforcement || "recorded";
    if (mode === "required" && !gps) {
      setNote("GPS location is required for this action — enable location and try again.");
      return;
    }
    if (faceRequiredFor(scope)) {
      setPendingAction({ scope, staffId, gps });
    } else {
      await runAction(scope, staffId, null, gps);
    }
  };

  const handleCheckIn = (staffId) => handleAction("checkin", staffId);
  const handleCheckOut = (staffId) => handleAction("checkout", staffId);

  const handleGrantReLogin = async (staffId) => {
    try {
      await api.patch("/attendance/grant-relogin", { staffId });
      setNote("Re-login permission granted. The staff member can now scan their face to log in again today.");
      loadRecords();
    } catch (err) {
      setNote(err.response?.data?.message || "Failed to grant re-login permission.");
    }
  };

  const handleComputeSalary = async () => {
    if (!selectedStaff) return;
    const { data } = await api.get(`/attendance/salary/${selectedStaff}`, { params: { month } });
    setSalary(data.data);
  };

  const recordFor = (staffId) => records.find((r) => r.staff?._id === staffId || r.staff === staffId);

  const stats = {
    logged: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => {
      const isLate = r.notes?.toLowerCase().includes('late');
      return isLate;
    }).length,
    leaves: 0
  };

  const columns = [
    { key: "employee", label: "EMPLOYEE", render: (row) => <span className="font-semibold text-ocean-900">{row.name}</span> },
    { key: "date", label: "DATE", render: () => <span className="text-ocean-600">{today()}</span> },
    { key: "checkIn", label: "CHECK IN", render: (row) => {
        const rec = recordFor(row._id);
        return rec?.checkIn ? <span className="font-mono text-ocean-800">{new Date(rec.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> : "-";
      }
    },
    { key: "checkOut", label: "CHECK OUT", render: (row) => {
        const rec = recordFor(row._id);
        return rec?.checkOut ? <span className="font-mono text-ocean-800">{new Date(rec.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> : "-";
      }
    },
    { key: "type", label: "TYPE", render: () => <span className="text-ocean-600">Office</span> },
    {
      key: "status",
      label: "STATUS",
      render: (row) => {
        const rec = recordFor(row._id);
        if (!rec) return <Badge color="gray">Not marked</Badge>;
        let color = statusColors[rec.status] || "gray";
        let text = rec.status;
        if (rec.notes?.toLowerCase().includes('late')) {
          color = "amber";
          text = "Late";
        }
        return <Badge color={color}>{text.charAt(0).toUpperCase() + text.slice(1)}</Badge>;
      },
    },
    {
      key: "actions",
      label: "ACTION",
      render: (row) => {
        const rec = recordFor(row._id);
        const checkedOut = !!rec?.checkOut;
        const reLoginGranted = !!rec?.allowReLogin;
        return canCreate ? (
          <div className="flex gap-2">
            <button disabled={!!rec?.checkIn} onClick={() => handleCheckIn(row._id)} className="btn-secondary py-1 text-xs" title="Check In">
              <LogIn size={13} />
            </button>
            <button disabled={!rec?.checkIn || !!rec?.checkOut} onClick={() => handleCheckOut(row._id)} className="btn-secondary py-1 text-xs" title="Check Out">
              <LogOut size={13} />
            </button>
            {checkedOut && !reLoginGranted && (
              <button
                onClick={() => handleGrantReLogin(row._id)}
                className="btn-secondary py-1 text-xs border-amber-400 text-amber-600 hover:bg-amber-50"
                title="Grant Re-Login permission"
              >
                <KeyRound size={13} />
              </button>
            )}
            {reLoginGranted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <KeyRound size={10} /> Re-login OK
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-ocean-400">—</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ocean-900">Attendance Management</h1>
          <p className="text-sm text-ocean-500 mt-1">Monitor employee attendance and leave requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary text-xs"><Download size={14} /> Export</button>
          <button onClick={() => setShowCalculator(true)} className="btn-secondary text-xs border-teal-500 text-teal-600 hover:bg-teal-50"><Calculator size={14} /> Calculator</button>
          <button className="btn-secondary text-xs border-brand-500 text-brand-600 hover:bg-brand-50"><ScanFace size={14} /> Face Check-In</button>
          <button className="btn-accent text-xs"><Plus size={14} /> Check In</button>
          <button className="btn-secondary text-xs"><LogOut size={14} /> Check Out</button>
          <button className="btn-accent text-xs bg-cyan-500 hover:bg-cyan-600 border-cyan-500"><Plus size={14} /> Apply Leave</button>
          <button className="btn-secondary text-xs border-coral-500 text-coral-600 hover:bg-coral-50"><XCircle size={14} /> Mark Absent</button>
        </div>
      </div>

      {note && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {note}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Logged Records</p>
            <p className="mt-1 text-2xl font-bold text-ocean-900">{stats.logged}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            <Clock size={20} />
          </div>
        </div>
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Present Today</p>
            <p className="mt-1 text-2xl font-bold text-ocean-900">{stats.present}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-500">
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Late / Left Early</p>
            <p className="mt-1 text-2xl font-bold text-ocean-900">{stats.late}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <AlertCircle size={20} />
          </div>
        </div>
        <div className="card flex items-center justify-between !py-4">
          <div>
            <p className="text-xs font-medium text-ocean-500">Pending Leaves</p>
            <p className="mt-1 text-2xl font-bold text-ocean-900">{stats.leaves}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-coral-50 text-coral-500">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden !p-0">
            <div className="border-b border-ocean-100 bg-ocean-50/50 px-5 py-4">
              <h3 className="font-bold text-ocean-900">Daily Attendance Log</h3>
            </div>
            <div className="p-0">
              <Table columns={columns} rows={staffList} emptyMessage="No attendance records." />
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="mb-4 font-bold text-ocean-900">Pending Leave Requests</h3>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-ocean-200 bg-ocean-50">
              <p className="text-sm text-ocean-400">No leave requests found.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-ocean-900">
                <IndianRupee size={18} className="text-teal-500" /> Monthly Salary Calculator
              </h3>
              <button onClick={() => setShowCalculator(false)} className="text-ocean-400 hover:text-ocean-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div className="flex-1">
                <label className="label">Staff Member</label>
                <select className="input-field" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Month</label>
                <input type="month" className="input-field" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
              <button onClick={handleComputeSalary} className="btn-accent">
                Compute
              </button>
            </div>

            {salary ? (
              <div className="space-y-2 rounded-lg bg-ocean-50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-ocean-600">Present days:</span> <strong className="text-ocean-900">{salary.presentDays}</strong></div>
                <div className="flex justify-between"><span className="text-ocean-600">Half days:</span> <strong className="text-ocean-900">{salary.halfDays}</strong></div>
                <div className="flex justify-between">
                  <span className="text-ocean-600">Leaves:</span> 
                  <strong className="text-ocean-900">{salary.leaveDays} <span className="text-xs font-normal text-ocean-500">(first {salary.allowedLeaves} paid)</span></strong>
                </div>
                <div className="flex justify-between"><span className="text-ocean-600">Absent days (unpaid):</span> <strong className="text-ocean-900">{salary.absentDays}</strong></div>
                <div className="flex justify-between"><span className="text-ocean-600">Overtime hours:</span> <strong className="text-ocean-900">{salary.totalOvertimeHours}</strong></div>
                <div className="flex justify-between"><span className="text-ocean-600">Overtime pay:</span> <strong className="text-emerald-600">+₹{salary.overtimePay}</strong></div>
                <div className="flex justify-between"><span className="text-ocean-600">Leave deduction:</span> <strong className="text-coral-500">−₹{salary.deduction}</strong></div>
                <div className="mt-2 border-t border-ocean-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-ocean-900">Net Salary</span>
                  <span className="text-xl font-bold text-teal-600">₹{salary.grossSalary}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-ocean-400 py-4">Select a staff member and month to compute salary.</p>
            )}
          </div>
        </div>
      )}

      {pendingAction && (
        <FaceCapture
          onCapture={(photo) => runAction(pendingAction.scope, pendingAction.staffId, photo, pendingAction.gps)}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};

export default Attendance;
