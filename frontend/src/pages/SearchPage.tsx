import { useSearchParams } from "react-router-dom";

import { HomePage } from "./HomePage";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";

  return (
    <HomePage
      pageTitle="检索结果"
      pageDescription="围绕当前关键词整理匹配资源，支持继续补充筛选条件后缩小范围。"
      summary={
        <div className="search-summary">
          搜索关键词：<strong>{keyword || "全部"}</strong>
        </div>
      }
    />
  );
}
