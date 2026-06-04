import {App as AntApp, Button, Card, Input, Space} from "antd";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";

import {PageHero, StatusBadge} from "../../components/Surface";
import {api} from "../../lib/api";
import type {Category, Resource} from "../../types";

export function ResourceListPage() {
  const {message} = AntApp.useApp();
  const [items, setItems] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [year, setYear] = useState("");
  const [status, setStatus] = useState<string | undefined>();

  const load = async () => {
    const params = new URLSearchParams({page: "1", page_size: "20"});
    if (keyword) params.set("keyword", keyword);
    if (categoryId) params.set("category_id", String(categoryId));
    if (year) params.set("year", year);
    if (status) params.set("status", status);
    const [resourceResult, categoryResult] = await Promise.all([
      api.listAdminResources(params),
      api.listAdminCategories(),
    ]);
    setItems(resourceResult.items);
    setCategories(categoryResult.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const remove = async (id: number) => {
    try {
      await api.deleteResource(id);
      message.success("资源已删除");
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <div className="page-stack page-stack--compact">
      <PageHero
        eyebrow=""
        title="资源管理"
        description="统一查看资源标题、分类、状态和更新时间，支持按关键词、年份与状态快速筛选。"
      />
      <Card className="admin-page-card">
        <div className="admin-filter-panel">
          <div className="admin-filter-panel__heading">
            <strong>筛选条件</strong>
            <span>先缩小范围，再执行编辑或删除操作。</span>
          </div>
          <Space wrap className="admin-filters">
            <Input
              placeholder="搜索标题、描述、标签"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <select
              className="field-select"
              value={categoryId ?? ""}
              onChange={(event) =>
                setCategoryId(
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }>
              <option value="">全部分类</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Input
              aria-label="后台年份筛选"
              placeholder="年份"
              value={year}
              onChange={(event) =>
                setYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))
              }
              inputMode="numeric"
            />
            <select
              className="field-select"
              value={status ?? ""}
              onChange={(event) => setStatus(event.target.value || undefined)}>
              <option value="">全部状态</option>
              <option value="active">公开中</option>
              <option value="hidden">已隐藏</option>
              <option value="expired">已失效</option>
            </select>
            <Button type="primary" onClick={() => void load()}>
              搜索
            </Button>
          </Space>
        </div>
        <div className="table-shell">
          <table className="resource-table resource-table--admin">
            <thead>
              <tr>
                <th>标题</th>
                <th>年份</th>
                <th>分类</th>
                <th>状态</th>
                <th>浏览量</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => (
                <tr key={record.id}>
                  <td className="resource-table__title-cell">{record.title}</td>
                  <td>{record.year}</td>
                  <td>{record.category.name}</td>
                  <td>
                    <StatusBadge kind="resource" status={record.status} />
                  </td>
                  <td>{record.copy_count_total}</td>
                  <td>
                    {new Date(record.updated_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td>
                    <Space>
                      <Link to={`/admin/resources/${record.id}/edit`}>
                        编辑
                      </Link>
                      <Button
                        type="link"
                        danger
                        onClick={() => void remove(record.id)}>
                        删除
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
