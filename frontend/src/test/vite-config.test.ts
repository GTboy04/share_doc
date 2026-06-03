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

describe("public mobile responsive styles", () => {
  it("includes the critical narrow-screen rules for public pages", () => {
    const stylesSource = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

    expect(stylesSource).toContain("@media (max-width: 640px)");
    expect(stylesSource).toContain(".search-panel__controls");
    expect(stylesSource).toContain("flex-direction: column;");
    expect(stylesSource).toContain(".detail-link-card");
    expect(stylesSource).toContain("position: static;");
    expect(stylesSource).toContain(".request-form-grid__split");
    expect(stylesSource).toContain("grid-template-columns: 1fr;");
    expect(stylesSource).toContain("flex: 1 1 0;");
    expect(stylesSource).toContain("min-width: 0;");
  });
});
