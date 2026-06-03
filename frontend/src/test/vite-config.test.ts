// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("vite dev server proxy", () => {
  it("proxies api requests to the backend server", () => {
    const configSource = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");

    expect(configSource).toContain('proxy: {');
    expect(configSource).toContain('"/api": {');
    expect(configSource).toContain('target: apiProxyTarget');
    expect(configSource).toContain('changeOrigin: true');
    expect(configSource).toContain('VITE_API_PROXY_TARGET || "http://127.0.0.1:8000"');
  });
});
