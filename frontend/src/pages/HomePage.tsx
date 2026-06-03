import { ClockCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { PageHero } from "../components/Surface";
import { api } from "../lib/api";
import type { Category, Resource } from "../types";

interface HomePageProps {
  pageTitle?: string;
  pageDescription?: string;
  summary?: React.ReactNode;
}

export function HomePage({
  pageTitle = "资源检索",
  pageDescription = "集中查看资料标题、年份、分类与更新时间，先检索、再进入详情、最后复制目标网盘链接。",
  summary,
}: HomePageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));
  const [year, setYear] = useState(searchParams.get("year") ?? "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category_slug") ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void api.listPublicCategories().then((result) => setCategories(result.items));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", "10");
    if (keyword) params.set("keyword", keyword);
    if (year) params.set("year", year);
    if (activeCategory) params.set("category_slug", activeCategory);
    setLoading(true);
    void api
      .listPublicResources(params)
      .then((result) => {
        setResources(result.items);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, keyword, page, year]);

  const onSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (year) params.set("year", year);
    if (activeCategory) params.set("category_slug", activeCategory);
    params.set("page", "1");
    setSearchParams(params);
    if (keyword) {
      navigate(`/search?${params.toString()}`);
      return;
    }
    navigate(`/?${params.toString()}`);
    setPage(1);
  };

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Resource Discovery"
        title={pageTitle}
        description={pageDescription}
        extra={
          <div className="hero-stat-card">
            <strong>{total}</strong>
            <span>当前匹配资源</span>
          </div>
        }
      />

      <Card className="content-card content-card--elevated">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div className="search-panel">
            <div className="search-panel__heading">
              <Typography.Title level={5}>检索条件</Typography.Title>
              <Typography.Paragraph>
                先通过关键词、年份和分类缩小范围，再进入详情确认资源是否匹配需求。
              </Typography.Paragraph>
            </div>
            <div className="search-panel__controls">
              <Input.Search
                allowClear
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onSearch={onSearch}
                placeholder="搜索资料标题、描述、标签..."
                enterButton="搜索"
              />
              <div className="year-filter-row">
                <label className="field-label" htmlFor="public-year-filter">
                  年份筛选
                </label>
                <Input
                  id="public-year-filter"
                  aria-label="年份筛选"
                  value={year}
                  onChange={(event) => setYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                  placeholder="例如：2027"
                  inputMode="numeric"
                />
              </div>
            </div>
            <Space wrap className="category-tag-row">
              <Tag.CheckableTag checked={activeCategory === ""} onChange={() => setActiveCategory("")}>
                全部
              </Tag.CheckableTag>
              {categories.map((category) => (
                <Tag.CheckableTag
                  key={category.id}
                  checked={activeCategory === category.slug}
                  onChange={() => setActiveCategory(category.slug)}
                >
                  {category.name}
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>

          {summary}

          <Typography.Paragraph className="disclaimer-text">
            仅负责市面上流传资料的收集，不提供原创生产或私密资料获取。
          </Typography.Paragraph>

          <div className="section-heading">
            <div>
              <Typography.Title level={5}>资源列表</Typography.Title>
              <Typography.Paragraph>点击标题或操作按钮进入详情页，再复制所需平台链接。</Typography.Paragraph>
            </div>
            <div className="result-meta">共 {total} 条结果</div>
          </div>

          <div className="table-shell" aria-busy={loading}>
            <table className="resource-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>年份</th>
                  <th>分类</th>
                  <th>描述</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="resource-table__title-cell">
                      <Link to={`/resources/${resource.id}`}>{resource.title}</Link>
                    </td>
                    <td>{resource.year}</td>
                    <td>{resource.category.name}</td>
                    <td className="resource-table__description">{resource.description}</td>
                    <td>
                      <span className="resource-table__time">
                        <ClockCircleOutlined />
                        {new Date(resource.updated_at).toLocaleDateString("zh-CN")}
                      </span>
                    </td>
                    <td>
                      <Button type="link">
                        <Link to={`/resources/${resource.id}`}>查看详情</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <Button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              上一页
            </Button>
            <span>
              第 {page} 页 / 共 {Math.max(1, Math.ceil(total / 10))} 页
            </span>
            <Button disabled={page >= Math.max(1, Math.ceil(total / 10))} onClick={() => setPage((value) => value + 1)}>
              下一页
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
}
