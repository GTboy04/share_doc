import { ArrowLeftOutlined, CopyOutlined, LinkOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Card, Descriptions, Space, Spin, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHero } from "../components/Surface";
import { api } from "../lib/api";
import type { Resource } from "../types";

export function ResourceDetailPage() {
  const { id = "" } = useParams();
  const { message } = AntApp.useApp();
  const [resource, setResource] = useState<Resource | null>(null);

  useEffect(() => {
    void api.getPublicResource(id).then(setResource);
  }, [id]);

  if (!resource) {
    return <Spin className="route-spinner" />;
  }

  const copyLink = async (linkId: number, title: string, url: string | null) => {
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      message.success(`${title} 链接已复制`);
    } catch {
      message.error("复制失败，请手动复制");
      return;
    }

    try {
      const result = await api.incrementResourceLinkCopyCount(resource.id, linkId);
      setResource((current) => {
        if (!current) {
          return current;
        }
        const nextLinks = current.links.map((link) =>
          link.id === result.link_id ? { ...link, copy_count: result.copy_count } : link,
        );
        return {
          ...current,
          links: nextLinks,
          copy_count_total: nextLinks.reduce((sum, link) => sum + link.copy_count, 0),
        };
      });
    } catch (error) {
      console.error("Failed to sync resource link copy count", error);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="资源详情"
        title={resource.title}
        description="确认资源年份、分类、标签与更新时间后，再复制目标网盘链接，避免误点或重复筛选。"
        extra={
          <Button icon={<ArrowLeftOutlined />}>
            <Link to="/">返回资源首页</Link>
          </Button>
        }
      />
      <Card className="content-card content-card--elevated">
        <div className="detail-layout">
          <div className="detail-layout__main">
            <Descriptions bordered column={1} className="detail-descriptions">
              <Descriptions.Item label="年份">{resource.year}</Descriptions.Item>
              <Descriptions.Item label="分类">{resource.category.name}</Descriptions.Item>
              <Descriptions.Item label="描述">{resource.description}</Descriptions.Item>
              <Descriptions.Item label="标签">
                <Space wrap>
                  {resource.tags.split(",").filter(Boolean).map((tag) => (
                    <Tag key={tag} className="detail-tag">
                      {tag.trim()}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(resource.updated_at).toLocaleString("zh-CN")}
              </Descriptions.Item>
            </Descriptions>
          </div>
          <aside className="detail-layout__aside">
            <div className="detail-link-card">
              <span className="detail-link-card__eyebrow">资源链接</span>
              <Typography.Paragraph className="detail-link-card__hint">
                支持多个平台入口。点击复制链接，不直接打开外部网盘页面。
              </Typography.Paragraph>
              <div className="detail-links">
                {resource.links.length === 0 ? <div className="detail-link-item detail-link-item--empty">暂未配置可复制链接</div> : null}
                {resource.links.map((item) => {
                  const title = item.custom_title || item.platform_label;
                  return (
                    <div key={item.id} className="detail-link-item">
                      <div className="detail-link-item__meta">
                        <div className="detail-link-item__title-row">
                          <LinkOutlined />
                          <strong>{title}</strong>
                          <Tag>{item.platform_label}</Tag>
                        </div>
                        <Typography.Paragraph className="detail-link-card__url">
                          {item.url ?? "暂未填写链接"}
                        </Typography.Paragraph>
                        <Typography.Paragraph className="detail-link-card__hint">
                          已复制 {item.copy_count} 次
                        </Typography.Paragraph>
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        className="detail-action"
                        icon={<CopyOutlined />}
                        disabled={!item.url}
                        aria-label={`复制${title}链接`}
                        onClick={() => void copyLink(item.id, title, item.url)}
                      >
                        复制链接
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </Card>
    </div>
  );
}
