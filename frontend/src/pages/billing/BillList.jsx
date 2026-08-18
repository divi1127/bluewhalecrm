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

  useEffect(() => {
    api.get("/billing").then(({ data }) => setBills(data.data)).finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ocean-900">Recent Bills</h2>
      {loading ? (
        <p className="text-sm text-ocean-400">Loading...</p>
      ) : (
        <Table columns={columns} rows={bills} />
      )}

      {detail && (
        <>
          <PrintSheet>
            {bill && (
              <div className="print-break flex justify-center bg-white p-4">
                <Invoice bill={bill} pkg={pkg} customer={customer} wristTags={tags} />
              </div>
            )}
            {tags.map((wristTag) => (
              <div key={wristTag._id} className="print-break flex justify-center bg-white p-4">
                <WristTag
                  tagId={wristTag.tagId}
                  qrCodeDataUrl={wristTag.qrCodeDataUrl}
                  customerName={customer?.name}
                  customerMobile={customer?.mobile}
                  packageName={pkg?.name}
                  personType={wristTag.personType}
                  adults={wristTag.adults ?? bill?.adults}
                  children={wristTag.children ?? bill?.children}
                  below5={wristTag.below5 ?? bill?.below5}
                  durationMinutes={pkg?.durationMinutes}
                  durationUnit={pkg?.durationUnit}
                  billNumber={bill?.billNumber}
                  status={wristTag.status}
                  entryTime={wristTag.entryTime}
                  expiryTime={wristTag.expiryTime}
                />
              </div>
            ))}
          </PrintSheet>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-bold text-ocean-900">Bill {bill?.billNumber}</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => window.print()} className="btn-primary">
                    <Printer size={16} /> Print Invoice & {tags.length} Wrist Tag{tags.length === 1 ? "" : "s"}
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
                    <WristTag
                      tagId={wristTag.tagId}
                      qrCodeDataUrl={wristTag.qrCodeDataUrl}
                      customerName={customer?.name}
                      customerMobile={customer?.mobile}
                      packageName={pkg?.name}
                      personType={wristTag.personType}
                      adults={wristTag.adults ?? bill?.adults}
                      children={wristTag.children ?? bill?.children}
                      below5={wristTag.below5 ?? bill?.below5}
                      durationMinutes={pkg?.durationMinutes}
                      durationUnit={pkg?.durationUnit}
                      billNumber={bill?.billNumber}
                      status={wristTag.status}
                      entryTime={wristTag.entryTime}
                      expiryTime={wristTag.expiryTime}
                    />
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
