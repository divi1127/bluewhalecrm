import { Waves, MapPin, Phone } from "lucide-react";
import { formatDuration } from "../../utils/format";

const paymentLabels = { cash: "Cash", card: "Card", upi: "UPI", wallet: "Wallet" };

const Invoice = ({ bill, pkg, customer, wristTag, wristTags }) => {
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const guests = Number(bill.adults || 0) + Number(bill.children || 0) + Number(bill.below5 || 0);
  const tags = wristTags && wristTags.length ? wristTags : wristTag ? [wristTag] : [];
  const below5Count = Number(bill.below5 || 0);
  const below5Amount = below5Count * Number(pkg?.below5Price || 0);

  return (
    <div className="w-[620px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-ocean-100">
      <div className="flex items-center justify-between bg-gradient-to-r from-ocean-900 via-ocean-700 to-teal-600 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Waves size={24} className="text-teal-300" />
          </div>
          <div>
            <p className="font-display text-xl font-extrabold tracking-wide">BLUEWHALE</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-teal-200">
              Park Management & Billing
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Tax Invoice</p>
          <p className="font-mono text-base font-bold tracking-widest">{bill.billNumber}</p>
          <p className="text-[11px] text-teal-100">{fmtDate(bill.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 px-6 pt-5 text-sm">
        <div>
          <p className="label">From</p>
          <p className="font-bold text-ocean-900">BlueWhale Adventure Park</p>
          <p className="mt-1 flex items-center gap-1.5 text-ocean-500">
            <MapPin size={13} /> Waterfront Road, Marina Promenade
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-ocean-500">
            <Phone size={13} /> +91 98765 43210
          </p>
        </div>
        <div>
          <p className="label">Bill To</p>
          <p className="font-bold text-ocean-900">{customer?.name}</p>
          {customer?.mobile && <p className="mt-1 text-ocean-500">Mobile: {customer.mobile}</p>}
          {customer?.whatsapp && <p className="text-ocean-500">WhatsApp: {customer.whatsapp}</p>}
          {customer?.address && <p className="text-ocean-500">Address: {customer.address}</p>}
        </div>
      </div>

      <div className="mx-6 mt-5 overflow-hidden rounded-xl border border-ocean-100">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-ocean-50 text-xs font-semibold uppercase tracking-wide text-ocean-500">
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5">Guests</th>
              <th className="px-4 py-2.5 text-right">Unit Price</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-ocean-50 text-ocean-800">
              <td className="px-4 py-3">
                <p className="font-semibold">{pkg?.name}</p>
                <p className="text-xs text-ocean-400">
                  {bill.adults} Adult{bill.adults === 1 ? "" : "s"} · {bill.children} Child{bill.children === 1 ? "" : "ren"} · {below5Count} Below 5 ·{" "}
                  {formatDuration(pkg)}
                </p>
              </td>
              <td className="px-4 py-3">{guests}</td>
              <td className="px-4 py-3 text-right">₹{pkg?.price}</td>
              <td className="px-4 py-3 text-right font-semibold">₹{pkg?.price}</td>
            </tr>
            {below5Count > 0 && (
              <tr className="border-t border-ocean-50 text-ocean-800">
                <td className="px-4 py-3">
                  <p className="font-semibold">Below-5 Child</p>
                  <p className="text-xs text-ocean-400">{below5Count} child(ren) below 5 years</p>
                </td>
                <td className="px-4 py-3">{below5Count}</td>
                <td className="px-4 py-3 text-right">₹{pkg?.below5Price || 0}</td>
                <td className="px-4 py-3 text-right font-semibold">₹{below5Amount}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mx-6 mt-4 flex justify-end">
        <div className="w-56 space-y-1.5 text-sm">
          <div className="flex justify-between text-ocean-500">
            <span>Subtotal</span>
            <span className="font-medium text-ocean-800">₹{bill.baseAmount}</span>
          </div>
          <div className="flex justify-between text-ocean-500">
            <span>Discount</span>
            <span className="font-medium text-coral-500">-₹{bill.discount || 0}</span>
          </div>
          <div className="flex justify-between rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 px-3 py-2 text-white">
            <span className="font-bold">Total Paid</span>
            <span className="font-display text-base font-extrabold">₹{bill.finalAmount}</span>
          </div>
          <p className="pt-1 text-right text-xs font-semibold text-ocean-500">
            Paid via {paymentLabels[bill.paymentMode] || bill.paymentMode}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t-2 border-dashed border-ocean-100 bg-sand-50 px-6 py-3 text-[11px] text-ocean-500">
        {tags.length ? (
          <p>
            {tags.length} Wrist Tag{tags.length === 1 ? "" : "s"} generated —{" "}
            {tags.map((t) => t.tagId).join(", ")}. Hand each printed tag to the customer; QRs are
            scanned at park entry to start the session timer.
          </p>
        ) : (
          <p>Thank you for visiting BlueWhale Adventure Park. Please keep this invoice for reference.</p>
        )}
      </div>
    </div>
  );
};

export default Invoice;
