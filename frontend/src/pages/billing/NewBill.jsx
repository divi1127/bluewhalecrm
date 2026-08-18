import React, { useEffect, useState } from "react";
import { Search, Receipt, Printer, CheckCircle2, UserPlus, UserCheck, StickyNote, MessageCircle, ScanLine, BadgePercent, AlertCircle, ShieldAlert } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import WristTag from "../../components/print/WristTag";
import Invoice from "../../components/print/Invoice";
import PrintSheet from "../../components/print/PrintSheet";
import QrScanner from "../../components/common/QrScanner";
import { formatDuration } from "../../utils/format";

const emptyForm = { name: "", mobile: "", whatsapp: "", address: "", notes: "" };

const NewBill = () => {
  const { can } = useAuth();
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [customer, setCustomer] = useState(null); // resolved returning customer
  const [lookupMsg, setLookupMsg] = useState(null); // { found, text }
  const [packageId, setPackageId] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [below5, setBelow5] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [couponCheck, setCouponCheck] = useState(null); // { checking, error, offer }
  const [paymentMode, setPaymentMode] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { bill, wristTags, customer }

  const canCreate = can("billing", "create");

  useEffect(() => {
    api.get("/packages?active=true").then(({ data }) => setPackages(data.data));
  }, []);

  // Auto-detect below5 package: package with the lowest price / that has a below5Price set
  const below5Package = packages.find(
    (p) => p.below5Price > 0 && p._id !== packageId
  ) || null;

  // When below5 count changes and there's a below5-specific package, show it
  const below5Count2 = Number(below5) || 0;

  const selectedPackage = packages.find((p) => p._id === packageId);
  const below5Count = Number(below5) || 0;
  const adultCount = Number(adults) || 0;
  const childCount = Number(children) || 0;
  const totalPersons = adultCount + childCount + below5Count;
  const adultChildAmount = selectedPackage ? (adultCount + childCount) * selectedPackage.price : 0;
  const below5Amount = selectedPackage ? below5Count * (selectedPackage.below5Price || 0) : 0;
  const baseAmount = adultChildAmount + below5Amount;

  const handleScanCoupon = (code) => {
    setCouponCode(String(code).trim().toUpperCase());
    setScannerOpen(false);
  };

  const checkCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponCheck({ checking: true, error: null, offer: null });
    try {
      const { data } = await api.post("/billing/verify-coupon", {
        packageId,
        adults: adultCount,
        children: childCount,
        below5: below5Count,
        couponCode: couponCode.trim(),
      });
      setCouponCheck({ checking: false, error: null, offer: data.data });
    } catch (err) {
      setCouponCheck({ checking: false, error: err.response?.data?.message || "Invalid coupon", offer: null });
    }
  };

  const handleLookup = async () => {
    if (!form.mobile.trim()) return;
    setError(null);
    setLookupMsg(null);
    const { data } = await api.get(`/customers/lookup/${form.mobile.trim()}`);
    if (data.data) {
      const c = data.data;
      setCustomer(c);
      setForm((f) => ({
        ...f,
        name: f.name || c.name,
        whatsapp: f.whatsapp || c.whatsapp,
        address: f.address || c.address,
      }));
      setLookupMsg({
        found: true,
        text: `Returning customer: ${c.name} (${c.customerType}, ${c.totalVisits} visits, spent ₹${c.totalSpending})`,
      });
    } else {
      setCustomer(null);
      setLookupMsg({ found: false, text: "No customer found for this mobile — registering a new customer." });
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setCustomer(null);
    setLookupMsg(null);
    setPackageId("");
    setAdults(1);
    setChildren(0);
    setBelow5(0);
    setCouponCode("");
    setCouponCheck(null);
    setPaymentMode("cash");
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        customerId: customer?._id,
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        whatsapp: form.whatsapp.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        packageId,
        adults,
        children,
        below5,
        paymentMode,
        couponCode: couponCode || undefined,
      };
      const { data } = await api.post("/billing", payload);
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate bill");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const { bill, wristTags, customer: billedCustomer } = result;
    const pkg = selectedPackage;
    const tags = wristTags && wristTags.length ? wristTags : [];
    return (
      <>
        {/* PRINT SHEET — bill first, then each tag on its own page */}
        <PrintSheet>
          <div className="print-break flex justify-center bg-white p-6">
            <Invoice bill={bill} pkg={pkg} customer={billedCustomer} wristTags={tags} />
          </div>
          {tags.map((wristTag) => (
            <div key={wristTag._id} className="print-break flex justify-center bg-white py-6 px-4">
              <WristTag
                tagId={wristTag.tagId}
                qrCodeDataUrl={wristTag.qrCodeDataUrl}
                indoorQrCodeDataUrl={wristTag.indoorQrCodeDataUrl}
                outdoorQrCodeDataUrl={wristTag.outdoorQrCodeDataUrl}
                customerName={billedCustomer.name}
                customerMobile={billedCustomer.mobile}
                packageName={pkg?.name}
                personType={wristTag.personType}
                durationMinutes={pkg?.durationMinutes}
                durationUnit={pkg?.durationUnit}
                billNumber={bill.billNumber}
                status={wristTag.status}
                indoorStatus={wristTag.indoorStatus}
                outdoorStatus={wristTag.outdoorStatus}
              />
            </div>
          ))}
        </PrintSheet>

        {/* ON-SCREEN PREVIEW — Bill on top, tags stacked below */}
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Header bar */}
          <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-ocean-900">
                <CheckCircle2 size={20} className="text-teal-500" /> Bill & Wrist Tags Generated
              </h2>
              <p className="text-sm text-ocean-400">
                {bill.billNumber} · {tags.length} wrist tag(s) · {totalPersons} person(s)
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => window.print()} className="btn-primary">
                <Printer size={16} /> Print Bill & Wrist Tags
              </button>
              <button onClick={resetForm} className="btn-accent">New Bill</button>
            </div>
          </div>

          {/* Invoice FULL WIDTH */}
          <div className="flex justify-center">
            <Invoice bill={bill} pkg={pkg} customer={billedCustomer} wristTags={tags} />
          </div>

          {/* Wrist tags stacked, one per row, centered */}
          {tags.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-ocean-500">
                Wrist Tags ({tags.length})
              </p>
              {tags.map((wristTag) => (
                <div key={wristTag._id} className="flex justify-center">
                  <WristTag
                    tagId={wristTag.tagId}
                    qrCodeDataUrl={wristTag.qrCodeDataUrl}
                    indoorQrCodeDataUrl={wristTag.indoorQrCodeDataUrl}
                    outdoorQrCodeDataUrl={wristTag.outdoorQrCodeDataUrl}
                    customerName={billedCustomer.name}
                    customerMobile={billedCustomer.mobile}
                    packageName={pkg?.name}
                    personType={wristTag.personType}
                    durationMinutes={pkg?.durationMinutes}
                    durationUnit={pkg?.durationUnit}
                    billNumber={bill.billNumber}
                    status={wristTag.status}
                    indoorStatus={wristTag.indoorStatus}
                    outdoorStatus={wristTag.outdoorStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-ocean-900">
          <Receipt size={20} className="text-teal-500" /> New Bill
        </h2>
        <p className="mb-5 text-sm text-ocean-400">
          Customer Arrives → Select Package → Enter Persons → Coupon → Payment → Bill + Wrist Tags
        </p>

        <div className="mb-5 rounded-xl border border-ocean-100 bg-ocean-50/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ocean-700">
              {customer ? <UserCheck size={16} className="text-teal-500" /> : <UserPlus size={16} className="text-teal-500" />}
              Customer Registration
            </h3>
            <button type="button" onClick={handleLookup} className="btn-secondary py-1.5 text-xs">
              <Search size={14} /> Find Returning Customer
            </button>
          </div>

          {lookupMsg && (
            <p
              className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                lookupMsg.found ? "bg-teal-50 text-teal-700" : "bg-sand-100 text-ocean-600"
              }`}
            >
              {lookupMsg.text}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="col-span-2">
              <label className="label">Customer Name *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <div className="flex gap-2">
                <input
                  className="input-field"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="10-digit mobile"
                  required
                />
                <button
                  type="button"
                  title="Use same number as WhatsApp"
                  onClick={() => setForm({ ...form, whatsapp: form.mobile })}
                  disabled={!form.mobile.trim()}
                  className="btn-secondary shrink-0 px-3"
                >
                  <MessageCircle size={16} className="text-teal-500" />
                </button>
              </div>
            </div>
            <div>
              <label className="label">WhatsApp Number</label>
              <input
                className="input-field"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="Same or different"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input
                className="input-field"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, area, city"
              />
            </div>
            <div className="col-span-2">
              <label className="label flex items-center gap-1.5">
                <StickyNote size={13} /> Visit Details (notes)
              </label>
              <textarea
                className="input-field min-h-[64px] resize-y"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Birthday visit, all-rides pass, special requests…"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Ticket / Package</label>
            <select className="input-field" value={packageId} onChange={(e) => setPackageId(e.target.value)} required>
              <option value="">Select a package</option>
              {packages.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{p.price} ({formatDuration(p)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Adults</label>
              <input type="number" min={0} className="input-field" value={adults} onChange={(e) => setAdults(e.target.value)} />
            </div>
            <div>
              <label className="label">Children</label>
              <input type="number" min={0} className="input-field" value={children} onChange={(e) => setChildren(e.target.value)} />
            </div>
            <div>
              <label className="label">Below 5 Years</label>
              <input type="number" min={0} className="input-field" value={below5} onChange={(e) => setBelow5(e.target.value)} />
            </div>
          </div>

          {/* Below-5 auto-detect notice */}
          {below5Count > 0 && selectedPackage && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <span className="mt-0.5 text-lg">👶</span>
              <div>
                <p className="font-semibold text-amber-800">
                  Below-5 rate detected: ₹{selectedPackage.below5Price || 0} × {below5Count} child(ren) = ₹{(selectedPackage.below5Price || 0) * below5Count}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Automatically applied from <strong>{selectedPackage.name}</strong>. Each below-5 child gets their own wrist tag.
                </p>
              </div>
            </div>
          )}
          {below5Count > 0 && !selectedPackage && (
            <p className="text-xs text-amber-600">⚠ Select a package first to see the below-5 rate.</p>
          )}
          <p className="text-xs text-ocean-400">
            Each adult/child is charged the package price individually. Below-5 children use a separate rate. Every person gets their own wrist tag.
          </p>

          <div>
            <label className="label">Coupon Code (optional)</label>
            <div className="flex flex-wrap gap-2">
              <input className="input-field min-w-[140px] flex-1" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. KUM-3F9A2B" />
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="btn-secondary shrink-0 px-3"
                title="Scan coupon QR"
              >
                <ScanLine size={16} className="text-teal-500" /> Scan
              </button>
              <button
                type="button"
                onClick={checkCoupon}
                disabled={!packageId || !couponCode.trim() || couponCheck?.checking}
                className="btn-accent shrink-0"
              >
                {couponCheck?.checking ? "Checking..." : "Check Offer"}
              </button>
            </div>
          </div>

          {couponCheck?.error && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                couponCheck.error.includes("already been used")
                  ? "border-red-300 bg-red-100 text-red-700"
                  : "border-coral-200 bg-coral-50 text-coral-600"
              }`}
            >
              {couponCheck.error.includes("already been used") ? (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
              )}
              <span>
                {couponCheck.error.includes("already been used")
                  ? `Coupon Already Used — ${couponCode}. This coupon was already redeemed and cannot be used again.`
                  : couponCheck.error}
              </span>
            </div>
          )}

          {couponCheck?.offer && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-teal-700">
                <BadgePercent size={15} /> Offer Applied — {couponCheck.offer.coupon.partnerName}
              </p>
              <div className="space-y-1 text-sm text-ocean-700">
                <p className="text-xs text-ocean-500">
                  {couponCheck.offer.coupon.campaignName} ·{" "}
                  {couponCheck.offer.coupon.discountType === "flat"
                    ? `Flat ₹${couponCheck.offer.coupon.discountValue} off`
                    : `${couponCheck.offer.coupon.discountValue}% off`}
                  {couponCheck.offer.coupon.minBillAmount > 0
                    ? ` · Min bill ₹${couponCheck.offer.coupon.minBillAmount}`
                    : ""}
                </p>
                <div className="flex justify-between">
                  <span>Package ({couponCheck.offer.package.name})</span>
                  <span className="font-medium">₹{couponCheck.offer.package.price}</span>
                </div>
                {couponCheck.offer.below5Count > 0 && (
                  <div className="flex justify-between">
                    <span>Below-5 × {couponCheck.offer.below5Count} (₹{couponCheck.offer.package.below5Price} each)</span>
                    <span className="font-medium">₹{couponCheck.offer.below5Amount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-teal-200 pt-1">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{couponCheck.offer.baseAmount}</span>
                </div>
                <div className="flex justify-between text-coral-600">
                  <span>Coupon discount</span>
                  <span className="font-semibold">-₹{couponCheck.offer.discount}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 px-3 py-2 text-white">
                  <span className="font-bold">Final Amount</span>
                  <span className="font-display text-base font-extrabold">₹{couponCheck.offer.finalAmount}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label">Payment Mode</label>
            <select className="input-field" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>

          {selectedPackage && (
            <div className="rounded-xl border border-ocean-100 bg-gradient-to-br from-ocean-50 to-white px-4 py-4 text-sm text-ocean-700">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ocean-400">Bill Summary — {selectedPackage.name}</p>
              {(adultCount + childCount) > 0 && (
                <div className="flex items-center justify-between">
                  <span>Adults/Children × {adultCount + childCount} @ ₹{selectedPackage.price} each</span>
                  <span className="font-semibold">₹{adultChildAmount}</span>
                </div>
              )}
              {below5Count > 0 && (
                <div className="mt-1 flex items-center justify-between">
                  <span>
                    Below-5 × {below5Count} @ ₹{selectedPackage.below5Price || 0} each
                  </span>
                  <span className="font-semibold">₹{below5Amount}</span>
                </div>
              )}
              {couponCheck?.offer && (
                <div className="mt-1 flex items-center justify-between text-coral-600">
                  <span>Coupon discount</span>
                  <span className="font-semibold">-₹{couponCheck.offer.discount}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between rounded-lg bg-ocean-900 px-3 py-2 text-white">
                <span className="font-bold">Bill Total</span>
                <span className="font-display text-base font-extrabold">
                  ₹{couponCheck?.offer ? couponCheck.offer.finalAmount : baseAmount}
                </span>
              </div>
              <p className="mt-2 text-xs text-ocean-400">
                {adultCount} adult(s) + {childCount} child(ren) + {below5Count} below-5 = {totalPersons} wrist tag{totalPersons === 1 ? "" : "s"}
              </p>
            </div>
          )}

          {error && <p className="text-sm font-medium text-coral-500">{error}</p>}

          {!canCreate ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              <ShieldAlert size={15} className="mt-0.5 shrink-0" />
              You can view billing but don't have permission to create bills. Ask your admin for access.
            </div>
          ) : (
            <button type="submit" disabled={submitting || !packageId} className="btn-accent w-full">
              {submitting ? "Processing..." : `Confirm Bill & Generate ${totalPersons} Wrist Tag${totalPersons === 1 ? "" : "s"}`}
            </button>
          )}
        </form>
      </div>

      {scannerOpen && <QrScanner onScan={handleScanCoupon} onClose={() => setScannerOpen(false)} />}
    </div>
  );
};

export default NewBill;
