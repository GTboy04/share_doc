import { App as AntApp, ConfigProvider, Spin } from "antd";
import zhCN from "antd/locale/zh_CN";
import { Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { AdminShell, PublicShell } from "./components/AppShell";
import { PrivateRoute } from "./components/PrivateRoute";
import { CategoryPage } from "./pages/admin/CategoryPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { RequestManagementPage } from "./pages/admin/RequestManagementPage";
import { ResourceFormPage } from "./pages/admin/ResourceFormPage";
import { ResourceListPage } from "./pages/admin/ResourceListPage";
import { HomePage } from "./pages/HomePage";
import { RequestFormPage } from "./pages/RequestFormPage";
import { RequestSuccessPage } from "./pages/RequestSuccessPage";
import { ResourceDetailPage } from "./pages/ResourceDetailPage";
import { SearchPage } from "./pages/SearchPage";

export function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#2f6bff",
          colorLink: "#2f6bff",
          colorSuccess: "#1f9a6d",
          colorWarning: "#c8821f",
          colorText: "#173153",
          colorTextSecondary: "#5d7093",
          colorBorder: "#dbe6f6",
          colorBgLayout: "#eff4fb",
          colorBgContainer: "#ffffff",
          borderRadius: 18,
          borderRadiusLG: 24,
          boxShadowSecondary: "0 20px 60px rgba(37, 84, 162, 0.12)",
          fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Layout: {
            bodyBg: "transparent",
            headerBg: "transparent",
            footerBg: "transparent",
            siderBg: "transparent",
          },
          Card: {
            borderRadiusLG: 24,
          },
          Button: {
            controlHeight: 42,
            borderRadius: 14,
            fontWeight: 600,
          },
          Input: {
            controlHeight: 44,
            borderRadius: 14,
          },
          Menu: {
            itemBorderRadius: 12,
            itemMarginInline: 6,
          },
          Tag: {
            borderRadiusSM: 999,
          },
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <Routes>
            <Route element={<PublicShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/resources/:id" element={<ResourceDetailPage />} />
              <Route path="/requests/new" element={<RequestFormPage />} />
              <Route path="/requests/success" element={<RequestSuccessPage />} />
            </Route>

            <Route path="/admin/login" element={<LoginPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/admin" element={<AdminShell />}>
                <Route path="resources" element={<ResourceListPage />} />
                <Route path="resources/new" element={<ResourceFormPage />} />
                <Route path="resources/:id/edit" element={<ResourceFormPage />} />
                <Route path="categories" element={<CategoryPage />} />
                <Route path="requests" element={<RequestManagementPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Spin className="route-spinner" />} />
          </Routes>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
