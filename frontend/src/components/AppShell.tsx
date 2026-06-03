import { Button, Layout, Menu, Space, Typography } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const { Header, Content, Footer, Sider } = Layout;

export function PublicShell() {
  const location = useLocation();

  return (
    <Layout className="site-shell">
      <Header className="public-header">
        <div className="site-frame public-header__inner">
          <div className="brand-block">
            <span className="brand-chip">Project Share Hub</span>
            <Typography.Title level={4} className="brand-title">
              项目共享平台
            </Typography.Title>
            <Typography.Text className="brand-subtitle">
              面向资料收集、检索与需求反馈的统一入口，保持清晰、可信、易访问。
            </Typography.Text>
          </div>
          <div className="public-header__actions">
            <Menu
              className="public-header__menu"
              theme="light"
              mode="horizontal"
              selectedKeys={[location.pathname.startsWith("/requests") ? "requests" : "home"]}
              items={[
                { key: "home", label: <Link to="/">资源首页</Link> },
                { key: "requests", label: <Link to="/requests/new">提交需求</Link> },
              ]}
            />
          </div>
        </div>
      </Header>
      <Content className="main-content">
        <div className="site-frame">
          <Outlet />
        </div>
      </Content>
      <Footer className="site-footer">
        <div className="site-frame site-footer__inner">
          <span>项目共享平台</span>
          <span>资料检索、详情访问与需求补充统一协作</span>
        </div>
      </Footer>
    </Layout>
  );
}

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  return (
    <Layout className="admin-shell">
      <Sider width={220} className="admin-sider">
        <div className="admin-brand">
          <span className="admin-brand__eyebrow">Admin Console</span>
          <strong>项目共享平台</strong>
          <span>资源、分类与需求的统一管理工作台</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            { key: "/admin/resources", label: <Link to="/admin/resources">资源管理</Link> },
            { key: "/admin/resources/new", label: <Link to="/admin/resources/new">添加资源</Link> },
            { key: "/admin/categories", label: <Link to="/admin/categories">分类管理</Link> },
            { key: "/admin/requests", label: <Link to="/admin/requests">需求管理</Link> },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Space className="admin-header__meta">
            <div className="admin-user-chip">
              <Typography.Text className="admin-user-chip__label">当前登录</Typography.Text>
              <Typography.Text strong>{admin?.username ?? "管理员"}</Typography.Text>
            </div>
            <Button
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              退出登录
            </Button>
          </Space>
        </Header>
        <Content className="admin-content">
          <div className="admin-content__inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
