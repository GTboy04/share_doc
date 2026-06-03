import { App as AntApp, Button, Card, Input, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHero } from "../components/Surface";
import { api } from "../lib/api";

export function RequestFormPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contact_email: "",
    contact_text: "",
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.submitRequest({
        ...formData,
        contact_email: formData.contact_email || null,
      });
      navigate("/requests/success");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "提交失败");
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Request Intake"
        title="提交需求"
        description="告诉我们你希望补充的资料类型、用途与联系方式，我们会在整理核验后尽快补充到平台。"
        align="center"
      />
      <Card className="request-card content-card--elevated">
        <div className="request-form-intro">
          <Typography.Title level={4}>需求登记</Typography.Title>
          <Typography.Paragraph>
            标题尽量明确，描述里建议写清楚资料用途、年份或格式需求，方便我们更快判断是否可收录。
          </Typography.Paragraph>
        </div>
        <Typography.Paragraph className="disclaimer-text">
          仅负责市面上流传资料的收集，不提供原创生产或私密资料获取。
        </Typography.Paragraph>
        <form className="simple-form request-form-grid" onSubmit={onSubmit}>
          <label className="field-label">需求标题</label>
          <Input
            aria-label="需求标题"
            value={formData.title}
            onChange={(event) => setFormData((value) => ({ ...value, title: event.target.value }))}
            placeholder="例如：求 1000 题 PDF"
          />
          <label className="field-label">需求描述</label>
          <Input.TextArea
            aria-label="需求描述"
            rows={5}
            value={formData.description}
            onChange={(event) => setFormData((value) => ({ ...value, description: event.target.value }))}
            placeholder="请描述资源内容、用途、格式等"
          />
          <div className="request-form-grid__split">
            <div>
              <label className="field-label">邮箱</label>
              <Input
                aria-label="邮箱"
                value={formData.contact_email}
                onChange={(event) => setFormData((value) => ({ ...value, contact_email: event.target.value }))}
                placeholder="可选，用于后续处理通知"
              />
            </div>
            <div>
              <label className="field-label">其他联系方式</label>
              <Input
                aria-label="其他联系方式"
                value={formData.contact_text}
                onChange={(event) => setFormData((value) => ({ ...value, contact_text: event.target.value }))}
                placeholder="微信 / QQ / 备注"
              />
            </div>
          </div>
          <div className="form-actions">
            <Button type="primary" htmlType="submit" disabled={!formData.title || !formData.description}>
              提交需求
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
