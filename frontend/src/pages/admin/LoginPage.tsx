import { App as AntApp, Button, Card, Input, Typography } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(username, password);
      navigate((location.state as { from?: string } | null)?.from ?? "/admin/resources", { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "登录失败");
    }
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <Card className="login-card">
          <span className="page-hero__eyebrow">Admin Console</span>
          <Typography.Title level={3}>管理员登录</Typography.Title>
          <Typography.Paragraph>
            进入后台后可统一维护资源、分类和需求队列，建议仅在可信设备上登录。
          </Typography.Paragraph>
          <form className="simple-form" onSubmit={onSubmit}>
            <label className="field-label">用户名</label>
            <Input aria-label="用户名" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" />
            <label className="field-label">密码</label>
            <Input.Password aria-label="密码" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </form>
        </Card>
        <div className="login-visual">
          <div className="login-visual__panel">
            <strong>统一管理视图</strong>
            <span>资源检索、状态维护、需求跟进集中在一个后台工作台完成。</span>
          </div>
          <div className="login-visual__grid">
            <div className="login-visual__card">
              <span>资源管理</span>
              <small>标题、分类、年份、状态</small>
            </div>
            <div className="login-visual__card">
              <span>需求队列</span>
              <small>待处理、处理中、已完成</small>
            </div>
            <div className="login-visual__card">
              <span>分类治理</span>
              <small>入口清晰、排序稳定</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
