import type React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "layout/Layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "contexts/AuthContext";
import Login from "pages/Login";
import Dashboard from "pages/Dashboard";
import Employees from "pages/Employees";
import Attendance from "pages/Attendance";
import Leaves from "pages/Leaves";
import Recruitment from "pages/Recruitment";
import Payroll from "pages/Payroll";
import Reports from "pages/Reports";
import Settings from "pages/Settings";
import Blogs from "pages/Blogs";

/**
 * Contract representing an application route item
 */
export interface AppRouteItem {
  /** Target URL pathname */
  path: string;
  /** React element to render */
  element: React.ReactNode;
}

/**
 * Configured routes map for the entire HRMS application
 */
export const appRoutes: AppRouteItem[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/employees",
    element: <Employees />,
  },
  {
    path: "/attendance",
    element: <Attendance />,
  },
  {
    path: "/leaves",
    element: <Leaves />,
  },
  {
    path: "/recruitment",
    element: <Recruitment />,
  },
  {
    path: "/payroll",
    element: <Payroll />,
  },
  {
    path: "/reports",
    element: <Reports />,
  },
  {
    path: "/blogs",
    element: <Blogs />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
];

import { AppLoader } from "shared/AppLoader";

/**
 * Public route guard preventing authenticated users from re-visiting login
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AppLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/**
 * Root routing component that dynamically maps route items inside the main layout
 *
 * @returns The rendered React Router Routes structure
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected HRMS Application Views */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {appRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

