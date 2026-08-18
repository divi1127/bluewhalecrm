import React, { useEffect, useState } from "react";
import { Plus, QrCode, Printer, CheckSquare, Pencil, Trash2 } from "lucide-react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import CouponTicket from "../../components/print/CouponTicket";
import PrintSheet from "../../components/print/PrintSheet";

const emptyForm = {
  partnerName: "",
  campaignName: "",
  discountType: "flat",
  discountValue: "",
  minBillAmount: "",
  validFrom: "",
  validTo: "",
  active: true,
  generateCount: "",
};

const Coupons = () => {
  const { can } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [codesModal, setCodesModal] = useState(null); // { coupon, generatedCodes }
  const [count, setCount] = useState(5);
  const [selected, setSelected] = useState([]); // selected code _ids for printing

  const canCreate = can("coupons", "create");
  const canEdit = can("coupons", "edit");

  const load = () => api.get("/coupons").then(({ data }) => setCoupons(data.data));

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { generateCount, ...payload } = form;
    let saved;
    if (editingId) {
      await api.put(`/coupons/${editingId}`, payload);
      saved = editingId;
    } else {
      const { data } = await api.post("/coupons", payload);
      saved = data.data._id;
    }
    resetForm();
    load();
    if (generateCount && Number(generateCount) > 0) {
      const coupon = coupons.find((c) => c._id === saved);
      await handleGenerateCodes(coupon || { _id: saved, partnerName: payload.partnerName, campaignName: payload.campaignName, discountType: payload.discountType, discountValue: payload.discountValue, minBillAmount: payload.minBillAmount, validFrom: payload.validFrom, validTo: payload.validTo }, Number(generateCount));
    }
  };

  const handleEdit = (row) => {
    setForm({
      partnerName: row.partnerName,
      campaignName: row.campaignName,
      discountType: row.discountType,
      discountValue: row.discountValue,
      minBillAmount: row.minBillAmount || "",
      validFrom: row.validFrom ? row.validFrom.slice(0, 10) : "",
      validTo: row.validTo ? row.validTo.slice(0, 10) : "",
      active: row.active,
    });
    setEditingId(row._id);
    setShowForm(true);
  };

  const handleToggleActive = async (row) => {
    await api.put(`/coupons/${row._id}`, { active: !row.active });
    load();
  };

  const handleGenerateCodes = async (coupon, amount = count) => {
    const { data } = await api.post(`/coupons/${coupon._id}/generate-codes`, { count: amount });
    setCodesModal({ coupon, generatedCodes: data.data });
    setSelected(data.data.map((c) => c._id));
    load();
  };

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectAll = () => setSelected(codesModal.generatedCodes.map((c) => c._id));

  const clearSelect = () => setSelected([]);

  // group selected coupons into chunks of 2 per sheet
  const selectedCodes = codesModal
    ? codesModal.generatedCodes.filter((c) => selected.includes(c._id))
    : [];

  const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const couponProps = (c, idx = 0) => ({
    partnerName: codesModal.coupon.partnerName,
    campaignName: codesModal.coupon.campaignName,
    discountType: codesModal.coupon.discountType,
    discountValue: codesModal.coupon.discountValue,
    minBillAmount: codesModal.coupon.minBillAmount,
    validFrom: codesModal.coupon.validFrom,
    validTo: codesModal.coupon.validTo,
    code: c.code,
    qrCodeDataUrl: c.qrCodeDataUrl,
    themeIndex: idx,
  });

  const columns = [
    { key: "partnerName", label: "Partner" },
    { key: "campaignName", label: "Campaign" },
    {
      key: "discount",
      label: "Discount",
      render: (row) => (row.discountType === "flat" ? `₹${row.discountValue} flat` : `${row.discountValue}%`),
    },
    { key: "totalCodesIssued", label: "Codes Issued" },
    {
      key: "validity",
      label: "Valid",
      render: (row) => `${new Date(row.validFrom).toLocaleDateString("en-IN")} - ${new Date(row.validTo).toLocaleDateString("en-IN")}`,
    },
    { key: "active", label: "Status", render: (row) => <Badge color={row.active ? "green" : "gray"}>{row.active ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {canCreate && (
            <button onClick={() => handleGenerateCodes(row)} className="btn-secondary py-1.5 text-xs">
              <QrCode size={14} /> Generate
            </button>
          )}
          {canEdit && (
            <button onClick={() => handleEdit(row)} title="Edit campaign" className="btn-secondary py-1.5 text-xs">
              <Pencil size={14} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => handleToggleActive(row)}
              title={row.active ? "Deactivate" : "Activate"}
              className="btn-secondary py-1.5 text-xs"
            >
              <Trash2 size={14} className={row.active ? "text-coral-500" : "text-teal-500"} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ocean-900">Outside Partner Coupons</h2>
        {canCreate && (
          <button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm((s) => !s); }} className="btn-accent">
            <Plus size={16} /> {showForm ? "Close" : "New Campaign"}
          </button>
        )}
      </div>

      {(canCreate || canEdit) && showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-2 gap-3">
          <div>
            <label className="label">Partner Name</label>
            <input className="input-field" required value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} />
          </div>
          <div>
            <label className="label">Campaign Name</label>
            <input className="input-field" required value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} />
          </div>
          <div>
            <label className="label">Discount Type</label>
            <select className="input-field" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>
          <div>
            <label className="label">Discount Value</label>
            <input type="number" className="input-field" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
          </div>
          <div>
            <label className="label">Minimum Bill Amount</label>
            <input type="number" className="input-field" value={form.minBillAmount} onChange={(e) => setForm({ ...form, minBillAmount: e.target.value })} />
          </div>
          <div>
            <label className="label">Valid From</label>
            <input type="date" className="input-field" required value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
          </div>
          <div>
            <label className="label">Valid To</label>
            <input type="date" className="input-field" required value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Codes to generate now (optional)</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={form.generateCount}
              placeholder="e.g. 5"
              onChange={(e) => setForm({ ...form, generateCount: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <button type="submit" className="btn-accent w-full">
              {editingId ? "Update Campaign" : "Create Campaign"}
            </button>
          </div>
        </form>
      )}

      <Table columns={columns} rows={coupons} />

      {codesModal && (
        <>
          <PrintSheet>
            <div className="coupon-sheet">
              {chunk(selectedCodes, 2).map((group, gi) => {
                const startIdx = gi * 2;
                return (
                  <div key={gi} className="print-break" style={{ padding: "12mm 10mm", background: "#f1f5f9", minHeight: "148mm" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8mm" }}>
                      {group.map((c, ci) => (
                        <div key={c._id}>
                          <CouponTicket {...couponProps(c, startIdx + ci)} compact />
                          {ci < group.length - 1 && (
                            <div style={{
                              display: "flex", alignItems: "center", gap: 8,
                              margin: "4mm 0", fontSize: 9,
                              color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em"
                            }}>
                              <div style={{ flex: 1, borderTop: "1.5px dashed #cbd5e1" }} />
                              ✂ Cut Here
                              <div style={{ flex: 1, borderTop: "1.5px dashed #cbd5e1" }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </PrintSheet>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-bold text-ocean-900">
                    {codesModal.coupon.partnerName} — Generated Codes
                  </h3>
                  <p className="text-sm text-ocean-400">
                    Select coupons to print. Each A4 sheet holds 2 coupons — print, cut along the dashed line.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={selectAll} className="btn-secondary py-1.5 text-xs">
                    <CheckSquare size={13} /> Select All
                  </button>
                  <button onClick={clearSelect} className="btn-secondary py-1.5 text-xs">
                    Clear
                  </button>
                </div>
              </div>

              <div className="my-4 grid grid-cols-1 gap-4 overflow-y-auto">
                {codesModal.generatedCodes.map((c, idx) => (
                  <label
                    key={c._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${
                      selected.includes(c._id)
                        ? "border-teal-400 ring-2 ring-teal-200"
                        : "border-transparent hover:border-ocean-200"
                    }`}
                    style={{
                      background: selected.includes(c._id) ? "rgba(20,184,166,0.05)" : "#fff",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-teal-500 shrink-0"
                      checked={selected.includes(c._id)}
                      onChange={() => toggleSelect(c._id)}
                    />
                    <div className="flex-1 min-w-0">
                      <CouponTicket {...couponProps(c, idx)} compact themeIndex={idx} />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2 border-t border-ocean-100 pt-4">
                <label className="label mb-0 mr-1 whitespace-nowrap">Copies per code</label>
                <input type="number" min="1" className="input-field w-24" value={count} onChange={(e) => setCount(e.target.value)} />
                <button onClick={() => handleGenerateCodes(codesModal.coupon)} className="btn-secondary">
                  Generate More
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  disabled={selectedCodes.length === 0}
                >
                  <Printer size={16} /> Print Selected ({selectedCodes.length})
                </button>
                <button onClick={() => setCodesModal(null)} className="btn-accent ml-auto">
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Coupons;
