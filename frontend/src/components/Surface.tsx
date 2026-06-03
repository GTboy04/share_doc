import { Tag, Typography } from "antd";

import type { CategoryStatus, RequestStatus, ResourceStatus } from "../types";

type StatusKind = "resource" | "request" | "category";

const statusMeta = {
  resource: {
    active: { label: "公开中", tone: "success" },
    hidden: { label: "已隐藏", tone: "warning" },
    expired: { label: "已失效", tone: "neutral" },
  } satisfies Record<ResourceStatus, { label: string; tone: string }>,
  request: {
    pending: { label: "待处理", tone: "warning" },
    processing: { label: "处理中", tone: "info" },
    done: { label: "已完成", tone: "success" },
    ignored: { label: "已忽略", tone: "neutral" },
  } satisfies Record<RequestStatus, { label: string; tone: string }>,
  category: {
    active: { label: "启用中", tone: "success" },
    hidden: { label: "已隐藏", tone: "neutral" },
  } satisfies Record<CategoryStatus, { label: string; tone: string }>,
} as const;

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function PageHero({ eyebrow, title, description, extra, className, align = "left" }: PageHeroProps) {
  return (
    <section className={["page-hero", `page-hero--${align}`, className].filter(Boolean).join(" ")}>
      <div className="page-hero__copy">
        {eyebrow ? <span className="page-hero__eyebrow">{eyebrow}</span> : null}
        <Typography.Title level={align === "center" ? 2 : 3} className="page-hero__title">
          {title}
        </Typography.Title>
        {description ? (
          <Typography.Paragraph className="page-hero__description">{description}</Typography.Paragraph>
        ) : null}
      </div>
      {extra ? <div className="page-hero__extra">{extra}</div> : null}
    </section>
  );
}

interface StatusBadgeProps {
  kind: StatusKind;
  status: ResourceStatus | RequestStatus | CategoryStatus;
}

export function StatusBadge({ kind, status }: StatusBadgeProps) {
  const meta = statusMeta[kind][status as never] as { label: string; tone: string } | undefined;
  const label = meta?.label ?? status;
  const tone = meta?.tone ?? "neutral";

  return (
    <Tag bordered={false} className={["status-badge", `status-badge--${tone}`].join(" ")}>
      {label}
    </Tag>
  );
}
