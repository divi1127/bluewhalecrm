import React, { useEffect, useState } from "react";
import { Eye, Printer } from "lucide-react";
import Table from "../../components/common/Table";
import api from "../../api/axios";
import Invoice from "../../components/print/Invoice";
import WristTag from "../../components/print/WristTag";
import PrintSheet from "../../components/print/PrintSheet";

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    api.get("/billing").then(({ data }) => setBills(data.data)).finally(() => setLoading(false));
  }, []);

  const filteredBills = bills.filter((b) => {
    const term = searchTerm.toLowerCase();
    const billMatch = b.billNumber?.toLowerCase().includes(term);
    const phoneMatch = b.customer?.mobile?.includes(term);
    return billMatch || phoneMatch;
  });

  const handleView = async (id) => {
    const { data } = await api.get(`/billing/${id}`);
    setDetail(data.data);
  };

  const columns = [
    { key: "billNumber", label: "Bill No." },
    { key: "customer", label: "Customer", render: (row) => row.customer?.name },
    { key: "mobile", label: "Mobile", render: (row) => row.customer?.mobile },
    { key: "package", label: "Package", render: (row) => row.package?.name },
    { key: "finalAmount", label: "Amount", render: (row) => `₹${row.finalAmount}` },
    { key: "paymentMode", label: "Payment" },
    { key: "createdAt", label: "Date", render: (row) => new Date(row.createdAt).toLocaleString("en-IN") },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button onClick={() => handleView(row._id)} className="btn-secondary py-1.5 text-xs">
          <Eye size={14} /> View
        </button>
      ),
    },
  ];

  const { bill, wristTags = [] } = detail || {};
  const pkg = bill?.package;
  const customer = bill?.customer;
  const tags = wristTags && wristTags.length ? wristTags : [];

  const renderWristTag = (wristTag) => (
    <WristTag
      tagId={wristTag.tagId}
      qrCodeDataUrl={wristTag.qrCodeDataUrl}
      indoorQrCodeDataUrl={wristTag.indoorQrCodeDataUrl}
      outdoorQrCodeDataUrl={wristTag.outdoorQrCodeDataUrl}
      customerName={customer?.name}
      customerMobile={customer?.mobile}
      packageName={pkg?.name}
      personType={wristTag.personType}
      durationMinutes={pkg?.durationMinutes}
      durationUnit={pkg?.durationUnit}
      billNumber={bill?.billNumber}
      status={wristTag.status}
      indoorStatus={wristTag.indoorStatus}
      outdoorStatus={wristTag.outdoorStatus}
    />
  );

  const handlePrint = (target) => {
    setPrintTarget(target);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintTarget(null), 600);
    }, 250);
  };

  const tagPages = tags.reduce((acc, t, i) => {
    const pageIdx = Math.floor(i / 3);
    (acc[pageIdx] = acc[pageIdx] || []).push(t);
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ocean-900">Recent Bills</h2>
        <input
          type="text"
          placeholder="Search Bill No or Mobile..."
          className="w-full sm:w-64 rounded-xl border border-ocean-200 bg-white px-4 py-2 text-sm text-ocean-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {loading ? (
        <p className="text-sm text-ocean-400">Loading...</p>
      ) : (
        <Table columns={columns} rows={filteredBills} />
      )}

      {detail && (
        <>
          {printTarget === "wrist-tags" && (
            <PrintSheet>
              <style>{`@page { size: A4 landscape; margin: 8mm; }`}</style>
              {tagPages.map((pageTags, pageIdx) => (
                <div key={pageIdx} className="wrist-page">
                  {pageTags.map((wristTag) => (
                    <div key={wristTag._id} className="wrist-slot">
                      {renderWristTag(wristTag)}
                    </div>
                  ))}
                </div>
              ))}
            </PrintSheet>
          )}
          {printTarget === "bill" && (
            <PrintSheet>
              {bill && (
                <div className="print-break flex justify-center bg-white p-4">
                  <Invoice bill={bill} pkg={pkg} customer={customer} wristTags={tags} />
                </div>
              )}
            </PrintSheet>
          )}
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-bold text-ocean-900">Bill {bill?.billNumber}</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handlePrint("wrist-tags")} className="btn-primary">
                    <Printer size={16} /> Print {tags.length} Wrist Tag{tags.length === 1 ? "" : "s"}
                  </button>
                  <button onClick={() => handlePrint("bill")} className="btn-secondary">
                    <Printer size={16} /> Print Bill
                  </button>
                  <button onClick={() => setDetail(null)} className="btn-accent">
                    Close
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                {bill && <Invoice bill={bill} pkg={pkg} customer={customer} wristTags={tags} />}
                {tags.map((wristTag) => (
                  <div key={wristTag._id} className="flex justify-center">
                    <div className="wrist-tag-preview">
                      {renderWristTag(wristTag)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BillList;
