import React, { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import api from "../../api/axios";

const NotificationPanel = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (open) {
      // Mock fetch or actual fetch if endpoint exists
      api.get("/notifications").then(({ data }) => {
        setNotifications(data.data || []);
      }).catch(() => {
        // mock fallback
        setNotifications([
          { _id: '1', message: "New user registered", read: false },
          { _id: '2', message: "Party booking from online", read: false },
          { _id: '3', message: "Staff John marked attendance", read: true }
        ]);
      });
    }
  }, [open]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) { }
    setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl flex flex-col transition-transform">
        <div className="flex items-center justify-between border-b border-ocean-100 p-4">
          <h2 className="text-lg font-bold text-ocean-900 flex items-center gap-2">
            <Bell size={20} /> Notifications
          </h2>
          <button onClick={onClose} className="p-2 text-ocean-500 hover:bg-ocean-50 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-ocean-400 text-center mt-10">No notifications.</p>
          ) : (
            notifications.map((n) => (
              !n.read && (
                <div key={n._id} className="p-3 bg-ocean-50 border border-ocean-100 rounded-lg flex justify-between items-start gap-3">
                  <p className="text-sm text-ocean-800">{n.message}</p>
                  <button onClick={() => markRead(n._id)} className="text-xs text-ocean-500 hover:text-ocean-700 whitespace-nowrap">
                    Mark Read
                  </button>
                </div>
              )
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
