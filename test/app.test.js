import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

function parseRgb(color) {
  const match = color.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/i);

  if (!match) {
    return null;
  }

  return match.slice(1).map(Number);
}

function isRedLike([red, green, blue]) {
  return red > 180 && green < 100 && blue < 100;
}

const redCheck =
  process.env.GITHUB_BASE_REF === "main" || process.env.GITHUB_REF_NAME === "main"
    ? it
    : it.skip;

describe("index.html", () => {
  it("includes the expected heading text", () => {
    const html = readFileSync(resolve("index.html"), "utf8");
    const dom = new JSDOM(html);
    const heading = dom.window.document.querySelector("h1");

    expect(heading?.textContent).toContain("こんにちは、川島太郎です");
  });

  describe("ページメタ情報", () => {
    it("title が「自己紹介ページ」である", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      expect(dom.window.document.title).toBe("自己紹介ページ");
    });

    it("html lang 属性が「ja」である", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      expect(dom.window.document.documentElement.lang).toBe("ja");
    });

    it("meta charset が「UTF-8」である", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      const charset = dom.window.document.querySelector("meta[charset]")?.getAttribute("charset");
      expect(charset?.toUpperCase()).toBe("UTF-8");
    });
  });

  describe("HTML構造", () => {
    it("h1 が1つだけ存在する", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      expect(dom.window.document.querySelectorAll("h1")).toHaveLength(1);
    });

    it("highlight カードが4件存在する", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      expect(dom.window.document.querySelectorAll(".highlight")).toHaveLength(4);
    });

    it("highlights section に aria-label が設定されている", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      const section = dom.window.document.querySelector(".highlights");
      expect(section?.getAttribute("aria-label")).toBeTruthy();
    });
  });

  describe("コンテンツ検証", () => {
    it("eyebrow テキストに「GitHub Actions 練習用プロジェクト」が含まれる", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      const eyebrow = dom.window.document.querySelector(".eyebrow");
      expect(eyebrow?.textContent).toContain("GitHub Actions 練習用プロジェクト");
    });

    it("lead テキストに「Web制作と自動化」が含まれる", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      const lead = dom.window.document.querySelector(".lead");
      expect(lead?.textContent).toContain("Web制作と自動化");
    });

    it.each(["Focus", "Now", "Goal", "Alert"])("highlight-label「%s」が存在する", (label) => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      const labels = Array.from(dom.window.document.querySelectorAll(".highlight-label")).map(
        (el) => el.textContent?.trim(),
      );
      expect(labels).toContain(label);
    });
  });

  describe("Alertカード", () => {
    it("最後の highlight カードに highlight-alert クラスが付いている", () => {
      const html = readFileSync(resolve("index.html"), "utf8");
      const dom = new JSDOM(html);
      const cards = dom.window.document.querySelectorAll(".highlight");
      const lastCard = cards[cards.length - 1];
      expect(lastCard?.classList.contains("highlight-alert")).toBe(true);
    });
  });

  redCheck("does not render any text in red", () => {
    const html = readFileSync(resolve("index.html"), "utf8");
    const css = readFileSync(resolve("style.css"), "utf8");
    const dom = new JSDOM(html, { pretendToBeVisual: true });
    const { document } = dom.window;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    const textNodes = Array.from(document.querySelectorAll("body *")).filter(
      (element) => (element.textContent ?? "").trim().length > 0,
    );

    for (const element of textNodes) {
      const rgb = parseRgb(dom.window.getComputedStyle(element).color);

      if (rgb) {
        expect(isRedLike(rgb)).toBe(false);
      }
    }
  });
});
