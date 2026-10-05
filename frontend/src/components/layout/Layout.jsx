import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import GlobalSessionAlert from "../common/GlobalSessionAlert";
import NotificationPanel from "./NotificationPanel";

// Standard app shell (sidebar + navbar) wrapping every page except Login and TV Display.
const Layout = ({ title, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-sand-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} onNotifClick={() => setNotifOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        <GlobalSessionAlert />
      </div>
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
};

export default Layout;