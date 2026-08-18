import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

// Standard app shell (sidebar + navbar) wrapping every page except Login and TV Display.
const Layout = ({ title, children }) => (
  <div className="flex h-screen bg-sand-50">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <Navbar title={title} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  </div>
);

export default Layout;
