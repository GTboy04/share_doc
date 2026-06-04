import {App as AntApp, Button, Card, Input, Space} from "antd";
import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

import {PageHero} from "../../components/Surface";
import {api} from "../../lib/api";
import type {Category, Resource, ResourceLinkPlatform} from "../../types";

interface EditableLink {
  id?: number;
  platform_type: ResourceLinkPlatform;
  custom_title: string;
  url: string;
  sort_order: number;
  copy_count: number;
}

const platformOptions: Array<{value: ResourceLinkPlatform; label: string}> = [
  {value: "quark", label: "夸克网盘"},
  {value: "baidu", label: "百度网盘"},
  {value: "xunlei", label: "迅雷网盘"},
  {value: "custom", label: "自定义"},
];

export function ResourceFormPage() {
  const navigate = useNavigate();
  const {id} = useParams();
  const {message} = AntApp.useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    year: "",
    description: "",
    tags: "",
    links: [] as EditableLink[],
    status: "active",
  });

  useEffect(() => {
    void api
      .listAdminCategories()
      .then((result) => setCategories(result.items));
    if (id) {
      const params = new URLSearchParams({page: "1", page_size: "100"});
      void api.listAdminResources(params).then((result) => {
        const resource = result.items.find((item) => String(item.id) === id);
        if (resource) {
          fillForm(resource);
        }
      });
    }
  }, [id]);

  const fillForm = (resource: Resource) => {
    setFormData({
      title: resource.title,
      category_id: String(resource.category.id),
      year: String(resource.year),
      description: resource.description,
      tags: resource.tags,
      links: resource.links.map((link, index) => ({
        id: link.id,
        platform_type: link.platform_type,
        custom_title: link.custom_title,
        url: link.url ?? "",
        sort_order: link.sort_order ?? index,
        copy_count: link.copy_count,
      })),
      status: resource.status,
    });
  };

  const addLink = () => {
    setFormData((value) => ({
      ...value,
      links: [
        ...value.links,
        {
          platform_type: "quark",
          custom_title: "",
          url: "",
          sort_order: value.links.length,
          copy_count: 0,
        },
      ],
    }));
  };

  const updateLink = <K extends keyof EditableLink>(
    index: number,
    key: K,
    nextValue: EditableLink[K],
  ) => {
    setFormData((value) => ({
      ...value,
      links: value.links.map((item, itemIndex) =>
        itemIndex === index ? {...item, [key]: nextValue} : item,
      ),
    }));
  };

  const removeLink = (index: number) => {
    setFormData((value) => ({
      ...value,
      links: value.links
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({...item, sort_order: itemIndex})),
    }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        year: Number(formData.year),
        links: formData.links.map((item, index) => ({
          platform_type: item.platform_type,
          id: item.id,
          custom_title: item.custom_title.trim(),
          url: item.url.trim() || null,
          sort_order: index,
        })),
      };
      if (id) {
        await api.updateResource(id, payload);
      } else {
        await api.createResource(payload);
      }
      message.success("保存成功");
      navigate("/admin/resources");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <div className="page-stack page-stack--compact">
      <PageHero
        eyebrow=""
        title={isEdit ? "编辑资源" : "添加资源"}
        description="统一维护资源标题、分类、年份、标签、描述与多平台链接，前台只展示并复制，不再直接跳转。"
      />
      <Card className="admin-page-card">
        <form className="simple-form admin-form-grid" onSubmit={onSubmit}>
          <label className="field-label">标题</label>
          <Input
            value={formData.title}
            onChange={(event) =>
              setFormData((value) => ({...value, title: event.target.value}))
            }
            placeholder="请输入资源标题"
          />
          <div className="admin-form-grid__split">
            <div>
              <label className="field-label">分类</label>
              <select
                className="field-select"
                value={formData.category_id}
                onChange={(event) =>
                  setFormData((value) => ({
                    ...value,
                    category_id: event.target.value,
                  }))
                }>
                <option value="">请选择分类</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">年份</label>
              <Input
                value={formData.year}
                onChange={(event) =>
                  setFormData((value) => ({
                    ...value,
                    year: event.target.value.replace(/[^\d]/g, "").slice(0, 4),
                  }))
                }
                placeholder="例如：2027"
                inputMode="numeric"
              />
            </div>
          </div>
          <label className="field-label">标签</label>
          <Input
            value={formData.tags}
            onChange={(event) =>
              setFormData((value) => ({...value, tags: event.target.value}))
            }
            placeholder="多个标签用逗号隔开"
          />
          <label className="field-label">描述</label>
          <Input.TextArea
            rows={5}
            value={formData.description}
            onChange={(event) =>
              setFormData((value) => ({
                ...value,
                description: event.target.value,
              }))
            }
          />
          <div className="links-editor">
            <div className="links-editor__header">
              <label className="field-label">链接配置</label>
              <Button htmlType="button" onClick={addLink}>
                添加链接
              </Button>
            </div>
            {formData.links.length === 0 ? (
              <div className="links-editor__empty">
                暂未添加链接项。可按平台类型逐条添加，链接地址可先留空。
              </div>
            ) : null}
            {formData.links.map((link, index) => (
              <div
                key={`${index}-${link.sort_order}`}
                className="link-editor-card">
                <div className="admin-form-grid__split">
                  <div>
                    <label className="field-label">平台类型</label>
                    <select
                      className="field-select"
                      value={link.platform_type}
                      onChange={(event) =>
                        updateLink(
                          index,
                          "platform_type",
                          event.target.value as ResourceLinkPlatform,
                        )
                      }>
                      {platformOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">自定义标题</label>
                    <Input
                      value={link.custom_title}
                      onChange={(event) =>
                        updateLink(index, "custom_title", event.target.value)
                      }
                      placeholder="例如：夸克备用 1"
                    />
                  </div>
                </div>
                <label className="field-label">链接地址</label>
                <Input
                  value={link.url}
                  onChange={(event) =>
                    updateLink(index, "url", event.target.value)
                  }
                  placeholder="https://...（可留空）"
                />
                <Space className="link-editor-card__actions">
                  <span>已复制 {link.copy_count} 次</span>
                  <Button
                    danger
                    htmlType="button"
                    onClick={() => removeLink(index)}>
                    删除该链接
                  </Button>
                </Space>
              </div>
            ))}
          </div>
          <label className="field-label">状态</label>
          <select
            className="field-select"
            value={formData.status}
            onChange={(event) =>
              setFormData((value) => ({...value, status: event.target.value}))
            }>
            <option value="active">公开中</option>
            <option value="hidden">已隐藏</option>
            <option value="expired">已失效</option>
          </select>
          <div className="form-actions">
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
