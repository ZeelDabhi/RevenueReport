import type {
  ReactNode,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout
  from "./components/AppLayout";

import DailyUploadPage
  from "./pages/DailyUploadPage";

import DashboardPage
  from "./pages/DashboardPage";

import LMUploadPage
  from "./pages/LMUploadPage";

import LoginPage
  from "./pages/LoginPage";

import OccupancyUploadPage
  from "./pages/OccupancyUploadPage";

import SpecialityRevenuePage
  from "./pages/SpecialityRevenuePage";

import TargetPage
  from "./pages/TargetPage";

import UploadStatusPage
  from "./pages/UploadStatusPage";

import RevenueTrendPage
  from "./pages/RevenueTrendPage";

import UserManagementPage
  from "./pages/UserManagementPage";

import SpecialityTrendPage
  from "./pages/SpecialityTrendPage";


// ======================================================
// USER ROLES
// ======================================================

type UserRole =
  | "SUPER_ADMIN"
  | "MASTER_ADMIN"
  | "ADMIN"
  | "DIRECTOR"
  | "INCHARGE_DIRECTOR"
  | "HO_USER";


// ======================================================
// STORED USER
// ======================================================

type StoredUser = {
  id?: number;
  name?: string;
  username?: string;
  role?: UserRole;
  unitId?: number | null;
};


// ======================================================
// VALID ROLES
// ======================================================

const VALID_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
  "HO_USER",
];


// ======================================================
// DASHBOARD ACCESS
// ======================================================

const DASHBOARD_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
  "HO_USER",
];


// ======================================================
// SPECIALITY REVENUE ACCESS
// ======================================================

const SPECIALITY_REVENUE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
];


// ======================================================
// LM UPLOAD ACCESS
// ======================================================

const LM_UPLOAD_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "HO_USER",
];


// ======================================================
// OPERATIONAL MODULE ACCESS
//
// Incharge Director is not allowed.
// ======================================================

const OPERATIONAL_MODULE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "HO_USER",
];


// ======================================================
// REVENUE TREND ACCESS
// ======================================================

const REVENUE_TREND_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
  "HO_USER",
];


// ======================================================
// SPECIALITY TREND ACCESS
// ======================================================

const SPECIALITY_TREND_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
];


// ======================================================
// USER MANAGEMENT ACCESS
// ======================================================

const USER_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
];


// ======================================================
// GET STORED USER
// ======================================================

function getStoredUser():
  StoredUser |
  null {

  try {

    const rawUser =
      localStorage.getItem(
        "revenue_user"
      );


    if (
      !rawUser
    ) {

      return null;

    }


    const parsed =
      JSON.parse(
        rawUser
      ) as StoredUser;


    if (
      !parsed.role ||
      !VALID_ROLES.includes(
        parsed.role
      )
    ) {

      return null;

    }


    return parsed;

  } catch {

    return null;

  }

}


// ======================================================
// AUTHENTICATED?
// ======================================================

function hasValidLocalSession():
  boolean {

  const token =
    localStorage.getItem(
      "revenue_token"
    );


  const user =
    getStoredUser();


  return Boolean(
    token &&
    user
  );

}


// ======================================================
// PROTECTED ROUTE
// ======================================================

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};


function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {

  const token =
    localStorage.getItem(
      "revenue_token"
    );


  if (
    !token
  ) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  const user =
    getStoredUser();


  if (
    !user ||
    !user.role
  ) {

    localStorage.removeItem(
      "revenue_token"
    );

    localStorage.removeItem(
      "revenue_user"
    );


    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  if (
    allowedRoles &&
    !allowedRoles.includes(
      user.role
    )
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return children;

}


// ======================================================
// ROOT REDIRECT
// ======================================================

function RootRedirect() {

  if (
    hasValidLocalSession()
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return (
    <Navigate
      to="/login"
      replace
    />
  );

}


// ======================================================
// UNKNOWN ROUTE
// ======================================================

function UnknownRoute() {

  if (
    hasValidLocalSession()
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return (
    <Navigate
      to="/login"
      replace
    />
  );

}


// ======================================================
// APP
// ======================================================

function App() {

  return (

    <Routes>

      {/* ==================================================
          ROOT
          ================================================== */}

      <Route
        path="/"
        element={
          <RootRedirect />
        }
      />


      {/* ==================================================
          LOGIN
          ================================================== */}

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />


      {/* ==================================================
          PROTECTED APPLICATION
          ================================================== */}

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >

        {/* ==================================================
            DASHBOARD
            ================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={
                DASHBOARD_ROLES
              }
            >
              <DashboardPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            SPECIALITY REVENUE
            ================================================== */}

        <Route
          path="/speciality-revenue"
          element={
            <ProtectedRoute
              allowedRoles={
                SPECIALITY_REVENUE_ROLES
              }
            >
              <SpecialityRevenuePage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            LM UPLOAD
            ================================================== */}

        <Route
          path="/lm-upload"
          element={
            <ProtectedRoute
              allowedRoles={
                LM_UPLOAD_ROLES
              }
            >
              <LMUploadPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            DAILY UPLOAD
            ================================================== */}

        <Route
          path="/daily-upload"
          element={
            <ProtectedRoute
              allowedRoles={
                OPERATIONAL_MODULE_ROLES
              }
            >
              <DailyUploadPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            BED OCCUPANCY
            ================================================== */}

        <Route
          path="/occupancy-upload"
          element={
            <ProtectedRoute
              allowedRoles={
                OPERATIONAL_MODULE_ROLES
              }
            >
              <OccupancyUploadPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            UPLOAD STATUS
            ================================================== */}

        <Route
          path="/upload-status"
          element={
            <ProtectedRoute
              allowedRoles={
                OPERATIONAL_MODULE_ROLES
              }
            >
              <UploadStatusPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            TARGETS
            ================================================== */}

        <Route
          path="/targets"
          element={
            <ProtectedRoute
              allowedRoles={
                OPERATIONAL_MODULE_ROLES
              }
            >
              <TargetPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            REVENUE TREND
            ================================================== */}

        <Route
          path="/revenue-trend"
          element={
            <ProtectedRoute
              allowedRoles={
                REVENUE_TREND_ROLES
              }
            >
              <RevenueTrendPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            SPECIALITY TREND
            ================================================== */}

        <Route
          path="/speciality-trend"
          element={
            <ProtectedRoute
              allowedRoles={
                SPECIALITY_TREND_ROLES
              }
            >
              <SpecialityTrendPage />
            </ProtectedRoute>
          }
        />


        {/* ==================================================
            USER MANAGEMENT
            ================================================== */}

        <Route
          path="/users"
          element={
            <ProtectedRoute
              allowedRoles={
                USER_MANAGEMENT_ROLES
              }
            >
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

      </Route>


      {/* ==================================================
          UNKNOWN / MANUAL RANDOM URL
          ================================================== */}

      <Route
        path="*"
        element={
          <UnknownRoute />
        }
      />

    </Routes>

  );

}


export default App;