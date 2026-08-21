import React from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Login from "./pages/Login";
import GamespotLanding from "./components/gamespot-landing/src/App";
import FaceLogin from "./pages/face/FaceLogin";
import StaffDashboard from "./pages/face/StaffDashboard";
import CashierDashboard from "./pages/face/CashierDashboard";
import Dashboard from "./pages/Dashboard";
import NewBill from "./pages/billing/NewBill";
import BillList from "./pages/billing/BillList";
import ScanEntry from "./pages/entry/ScanEntry";
import TVDisplay from "./pages/entry/TVDisplay";
import TagLookup from "./pages/entry/TagLookup";
import Customers from "./pages/crm/Customers";
import FollowUp from "./pages/crm/FollowUp";
import Enquiries from "./pages/crm/Enquiries";
import Coupons from "./pages/coupons/Coupons";
import Bookings from "./pages/bookings/Bookings";
import Packages from "./pages/packages/Packages";
import StaffList from "./pages/staff/StaffList";
import Attendance from "./pages/staff/Attendance";
import Salary from "./pages/staff/Salary";
import MyAttendance from "./pages/staff/MyAttendance";
import Reports from "./pages/reports/Reports";
import Control from "./pages/control/Control";
import AttendanceSettings from "./pages/control/AttendanceSettings";

const staffRoles = ["super_admin", "admin", "billing_staff", "cashier"];
const entryRoles = ["super_admin", "admin", "entry_staff"];
const hrRoles = ["super_admin", "admin", "hr_manager"];
const adminRoles = ["super_admin", "admin"];
const staffDashRoles = ["billing_staff", "entry_staff", "hr_manager"];
const cashierRoles = ["cashier"];

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Face login kiosk at the register — public, opens the webcam */}
      <Route path="/face-login" element={<FaceLogin />} />

      {/* Public marketing landing page — the first screen visitors see */}
      <Route path="/" element={<GamespotLanding />} />

      {/* TV Display is a full-screen kiosk view - no sidebar/nav, but still requires no auth to view */}
      <Route path="/tv-display" element={<TVDisplay />} />

      {/* Public wrist-tag verification page - opens when a phone scans the QR on the band */}
      <Route path="/scan-tag/:tagId" element={<TagLookup />} />
      <Route path="/scan-tag" element={<TagLookup />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={adminRoles} module="dashboard">
            <Layout title="Dashboard">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute roles={staffDashRoles}>
            <Layout title="Staff Dashboard">
              <StaffDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cashier-dashboard"
        element={
          <ProtectedRoute roles={cashierRoles}>
            <Layout title="Cashier Dashboard">
              <CashierDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/billing"
        element={
          <ProtectedRoute roles={staffRoles} module="billing">
            <Layout title="Billing">
              <NewBill />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/history"
        element={
          <ProtectedRoute roles={staffRoles} module="billing_history">
            <Layout title="Bill History">
              <BillList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/entry"
        element={
          <ProtectedRoute roles={entryRoles} module="entry">
            <Layout title="Entry QR Verification">
              <ScanEntry />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute roles={staffRoles} module="customers">
            <Layout title="Customer CRM">
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/followup"
        element={
          <ProtectedRoute roles={staffRoles} module="customers">
            <Layout title="Follow-up List">
              <FollowUp />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/enquiries"
        element={
          <ProtectedRoute roles={staffRoles} module="enquiries">
            <Layout title="Enquiries">
              <Enquiries />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coupons"
        element={
          <ProtectedRoute roles={staffRoles} module="coupons">
            <Layout title="Partner Coupons">
              <Coupons />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute module="bookings">
            <Layout title="Party / Event Bookings">
              <Bookings />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/packages"
        element={
          <ProtectedRoute roles={adminRoles} module="packages">
            <Layout title="Packages">
              <Packages />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute roles={hrRoles} module="staff">
            <Layout title="Staff Master">
              <StaffList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/attendance"
        element={
          <ProtectedRoute roles={hrRoles} module="attendance">
            <Layout title="Attendance">
              <Attendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/salary"
        element={
          <ProtectedRoute roles={hrRoles} module="salary">
            <Layout title="Salary">
              <Salary />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/my"
        element={
          <ProtectedRoute module="attendance">
            <Layout title="My Attendance">
              <MyAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={adminRoles} module="reports">
            <Layout title="Reports">
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/control"
        element={
          <ProtectedRoute roles={["super_admin"]} module="users">
            <Layout title="Control — Users & Access">
              <Control />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/control/attendance-settings"
        element={
          <ProtectedRoute roles={["super_admin", "admin"]} module="settings">
            <Layout title="Attendance Enforcement">
              <AttendanceSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
