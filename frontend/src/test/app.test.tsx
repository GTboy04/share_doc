import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { App } from "../App";

const resourcesResponse = {
  items: [
    {
      id: 1,
      title: "微信公众号【27红宝书】：2027考研英语红宝书PDF合集",
      year: 2027,
      description: "红宝书 PDF 完整版",
      tags: "考研,英语,PDF",
      links: [
        {
          id: 101,
          platform_type: "quark",
          platform_label: "夸克网盘",
          custom_title: "夸克主链",
          url: "https://pan.quark.cn/s/demo",
          sort_order: 0,
        },
        {
          id: 102,
          platform_type: "baidu",
          platform_label: "百度网盘",
          custom_title: "百度备用",
          url: null,
          sort_order: 1,
        },
      ],
      status: "active",
      category: {
        id: 1,
        name: "考研",
        slug: "kaoyan",
        sort_order: 1,
        status: "active",
      },
      created_at: "2026-06-02T10:00:00Z",
      updated_at: "2026-06-02T10:00:00Z",
    },
  ],
  total: 1,
  page: 1,
  page_size: 10,
};

const categoriesResponse = {
  items: [
    { id: 1, name: "考研", slug: "kaoyan", sort_order: 1, status: "active" },
    { id: 2, name: "软件", slug: "software", sort_order: 2, status: "active" },
  ],
};

describe("app routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders public home resources", async () => {
    vi.spyOn(window, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/resources")) {
        return Promise.resolve(new Response(JSON.stringify(resourcesResponse)));
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve(new Response(JSON.stringify(categoriesResponse)));
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("项目共享平台")).length).toBeGreaterThan(0);
    expect(await screen.findByText("微信公众号【27红宝书】：2027考研英语红宝书PDF合集")).toBeInTheDocument();
    expect(screen.getByText("仅负责市面上流传资料的收集，不提供原创生产或私密资料获取。")).toBeInTheDocument();
    expect(screen.getByText("2027")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "管理入口" })).not.toBeInTheDocument();
  });

  it("redirects anonymous users to admin login", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "unauthorized" }), { status: 401 }),
    );

    render(
      <MemoryRouter initialEntries={["/admin/resources"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText("管理员登录")).toBeInTheDocument();
  });

  it("renders admin resource list for authenticated users", async () => {
    localStorage.setItem("share-platform-admin-token", "demo-token");

    vi.spyOn(window, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/admin/auth/me")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 1,
              username: "admin",
              created_at: "2026-06-02T10:00:00Z",
            }),
          ),
        );
      }
      if (url.includes("/api/admin/resources")) {
        return Promise.resolve(new Response(JSON.stringify(resourcesResponse)));
      }
      if (url.includes("/api/admin/categories")) {
        return Promise.resolve(new Response(JSON.stringify(categoriesResponse)));
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <MemoryRouter initialEntries={["/admin/resources"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "资源管理" })).toBeInTheDocument();
    expect(screen.getByText("当前登录")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(await screen.findByText("微信公众号【27红宝书】：2027考研英语红宝书PDF合集")).toBeInTheDocument();
  });

  it("disables notify action for requests that are not done", async () => {
    localStorage.setItem("share-platform-admin-token", "demo-token");

    vi.spyOn(window, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/admin/auth/me")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 1,
              username: "admin",
              created_at: "2026-06-02T10:00:00Z",
            }),
          ),
        );
      }
      if (url.includes("/api/admin/requests")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  id: 1,
                  title: "待处理需求",
                  description: "desc",
                  contact_email: "user@example.com",
                  contact_text: "微信 demo",
                  status: "pending",
                  admin_note: "",
                  notified_at: null,
                  created_at: "2026-06-02T10:00:00Z",
                  updated_at: "2026-06-02T10:00:00Z",
                },
                {
                  id: 2,
                  title: "已完成需求",
                  description: "desc",
                  contact_email: "done@example.com",
                  contact_text: "QQ 123",
                  status: "done",
                  admin_note: "已处理",
                  notified_at: null,
                  created_at: "2026-06-02T10:00:00Z",
                  updated_at: "2026-06-02T10:00:00Z",
                },
              ],
              total: 2,
              page: 1,
              page_size: 20,
            }),
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <MemoryRouter initialEntries={["/admin/requests"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "需求管理" })).toBeInTheDocument();
    const notifyButtons = await screen.findAllByRole("button", { name: "发送通知" });
    expect(notifyButtons).toHaveLength(2);
    expect(notifyButtons[0]).toBeDisabled();
    expect(notifyButtons[1]).not.toBeDisabled();
  });

  it("submits request form and shows success page", async () => {
    vi.spyOn(window, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      if (url.includes("/api/categories")) {
        return Promise.resolve(new Response(JSON.stringify(categoriesResponse)));
      }
      if (url.includes("/api/resources")) {
        return Promise.resolve(new Response(JSON.stringify(resourcesResponse)));
      }
      if (url.includes("/api/requests") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 1,
              title: "求资料",
              description: "想要红宝书 PDF",
              contact_email: "user@example.com",
              contact_text: "微信 demo",
              status: "pending",
              admin_note: "",
              notified_at: null,
              created_at: "2026-06-02T10:00:00Z",
              updated_at: "2026-06-02T10:00:00Z",
            }),
            { status: 201 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <MemoryRouter initialEntries={["/requests/new"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("仅负责市面上流传资料的收集，不提供原创生产或私密资料获取。")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("需求标题"), { target: { value: "求资料" } });
    fireEvent.change(screen.getByLabelText("需求描述"), { target: { value: "想要红宝书 PDF" } });
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "user@example.com" } });
    fireEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText("需求已提交成功")).toBeInTheDocument();
    });
  });

  it("filters resources by year from the home page", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/resources")) {
        return Promise.resolve(new Response(JSON.stringify(resourcesResponse)));
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve(new Response(JSON.stringify(categoriesResponse)));
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const yearFilter = await screen.findByLabelText("年份筛选");
    fireEvent.change(yearFilter, { target: { value: "2027" } });

    await waitFor(() => {
      expect(fetchSpy.mock.calls.some(([input]) => String(input).includes("year=2027"))).toBe(true);
    });
  });

  it("renders a dedicated search results header", async () => {
    vi.spyOn(window, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/resources")) {
        return Promise.resolve(new Response(JSON.stringify(resourcesResponse)));
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve(new Response(JSON.stringify(categoriesResponse)));
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <MemoryRouter initialEntries={["/search?keyword=%E7%BA%A2%E5%AE%9D%E4%B9%A6"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText("检索结果")).toBeInTheDocument();
    expect(screen.getByText("搜索关键词：")).toBeInTheDocument();
    expect(screen.getByText("红宝书")).toBeInTheDocument();
  });

  it("renders a focused resource detail action area", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    vi.spyOn(window, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/api/resources/1")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ...resourcesResponse.items[0],
              id: 1,
            }),
          ),
        );
      }
      if (url.includes("/api/resources")) {
        return Promise.resolve(new Response(JSON.stringify(resourcesResponse)));
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve(new Response(JSON.stringify(categoriesResponse)));
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <MemoryRouter initialEntries={["/resources/1"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText("资源详情")).toBeInTheDocument();
    expect(screen.getByText("夸克主链")).toBeInTheDocument();
    expect(screen.getByText("百度备用")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /访问资源链接/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /复制夸克主链链接/ }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://pan.quark.cn/s/demo");
    });
    expect(screen.getByRole("button", { name: /复制百度备用链接/ })).toBeDisabled();
  });
});
