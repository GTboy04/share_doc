import { App as AntApp, Button, Card, Input, Space } from "antd";
import { useEffect, useState } from "react";

import { PageHero, StatusBadge } from "../../components/Surface";
import { api } from "../../lib/api";
import type { RequestStatus, UserRequest } from "../../types";

export function RequestManagementPage() {
  const { message } = AntApp.useApp();
  const [items, setItems] = useState<UserRequest[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<RequestStatus | undefined>();

  const load = async () => {
    const params = new URLSearchParams({ page: "1", page_size: "20" });
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    const result = await api.listAdminRequests(params);
    setItems(result.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (item: UserRequest, nextStatus: RequestStatus) => {
    try {
      await api.updateAdminRequest(item.id, { status: nextStatus, admin_note: item.admin_note });
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "更新失败");
    }
  };

  const notify = async (item: UserRequest) => {
    try {
      await api.notifyAdminRequest(item.id);
      message.success("通知已发送");
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "发送失败");
    }
  };

  const canNotify = (item: UserRequest) => item.status === "done" && Boolean(item.contact_email);

  return (
    <div className="page-stack page-stack--compact">
      <PageHero
        eyebrow="Request Queue"
        title="需求管理"
        description="聚焦待处理、处理中与已完成需求，优先提升状态可读性和操作节奏。"
      />
      <Card className="admin-page-card">
        <div className="admin-filter-panel">
          <div className="admin-filter-panel__heading">
            <strong>队列筛选</strong>
            <span>按状态和关键词过滤后，再做处理、完成或忽略操作。</span>
          </div>
          <Space wrap className="admin-filters">
            <select className="field-select" value={status ?? ""} onChange={(event) => setStatus((event.target.value as RequestStatus) || undefined)}>
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="done">已完成</option>
              <option value="ignored">已忽略</option>
            </select>
            <Input placeholder="搜索需求标题或联系方式" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            <Button type="primary" onClick={() => void load()}>
              搜索
            </Button>
          </Space>
        </div>
        <div className="table-shell">
          <table className="resource-table resource-table--admin">
            <thead>
              <tr>
                <th>需求标题</th>
                <th>联系方式</th>
                <th>状态</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="resource-table__title-cell">{item.title}</td>
                  <td>{item.contact_email || item.contact_text || "-"}</td>
                  <td>
                    <StatusBadge kind="request" status={item.status} />
                  </td>
                  <td>{new Date(item.created_at).toLocaleString("zh-CN")}</td>
                  <td>
                    <Space wrap>
                      <Button size="small" onClick={() => void updateStatus(item, "processing")}>
                        处理中
                      </Button>
                      <Button size="small" type="primary" onClick={() => void updateStatus(item, "done")}>
                        完成
                      </Button>
                      <Button size="small" danger onClick={() => void updateStatus(item, "ignored")}>
                        忽略
                      </Button>
                      <Button size="small" disabled={!canNotify(item)} onClick={() => void notify(item)}>
                        发送通知
                      </Button>
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
