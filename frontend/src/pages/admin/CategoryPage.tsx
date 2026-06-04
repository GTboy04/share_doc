import {App as AntApp, Button, Card, Input, Space} from "antd";
import {useEffect, useState} from "react";

import {PageHero, StatusBadge} from "../../components/Surface";
import {api} from "../../lib/api";
import type {Category} from "../../types";

export function CategoryPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const {message} = AntApp.useApp();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sort_order: "0",
    status: "active",
  });

  const load = async () => {
    const result = await api.listAdminCategories();
    setItems(result.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const values = {...formData, sort_order: Number(formData.sort_order)};
      if (editing) {
        await api.updateCategory(editing.id, values);
      } else {
        await api.createCategory(values);
      }
      setEditing(null);
      setFormData({name: "", slug: "", sort_order: "0", status: "active"});
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.deleteCategory(id);
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <div className="page-stack page-stack--compact">
      <PageHero
        eyebrow=""
        title="分类管理"
        description="维护前台分类名称、排序与显示状态，保证资源检索入口始终清晰稳定。"
      />
      <Card
        className="admin-page-card"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              setFormData({
                name: "",
                slug: "",
                sort_order: "0",
                status: "active",
              });
            }}>
            新增分类
          </Button>
        }>
        <form
          className="simple-form compact-form admin-form-grid"
          onSubmit={onSave}>
          <label className="field-label">名称</label>
          <Input
            value={formData.name}
            onChange={(event) =>
              setFormData((value) => ({...value, name: event.target.value}))
            }
          />
          <label className="field-label">Slug</label>
          <Input
            value={formData.slug}
            onChange={(event) =>
              setFormData((value) => ({...value, slug: event.target.value}))
            }
          />
          <div className="admin-form-grid__split">
            <div>
              <label className="field-label">排序</label>
              <Input
                value={formData.sort_order}
                onChange={(event) =>
                  setFormData((value) => ({
                    ...value,
                    sort_order: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="field-label">状态</label>
              <select
                className="field-select"
                value={formData.status}
                onChange={(event) =>
                  setFormData((value) => ({
                    ...value,
                    status: event.target.value,
                  }))
                }>
                <option value="active">启用中</option>
                <option value="hidden">已隐藏</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <Button type="primary" htmlType="submit">
              {editing ? "更新分类" : "新增分类"}
            </Button>
          </div>
        </form>
        <div className="table-shell">
          <table className="resource-table resource-table--admin">
            <thead>
              <tr>
                <th>名称</th>
                <th>Slug</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => (
                <tr key={record.id}>
                  <td className="resource-table__title-cell">{record.name}</td>
                  <td>{record.slug}</td>
                  <td>{record.sort_order}</td>
                  <td>
                    <StatusBadge kind="category" status={record.status} />
                  </td>
                  <td>
                    <Space>
                      <Button
                        type="link"
                        onClick={() => {
                          setEditing(record);
                          setFormData({
                            name: record.name,
                            slug: record.slug,
                            sort_order: String(record.sort_order),
                            status: record.status,
                          });
                        }}>
                        编辑
                      </Button>
                      <Button
                        type="link"
                        danger
                        onClick={() => void onDelete(record.id)}>
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
