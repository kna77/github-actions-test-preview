import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";

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
  let document;
  let dom;

  beforeAll(() => {
    const html = readFileSync(resolve("index.html"), "utf8");
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  it("includes the expected heading text", () => {
    const heading = document.querySelector("h1");
    expect(heading?.textContent).toContain("こんにちは、川島太郎です");
  });

  describe("ページメタ情報", () => {
    it("title が「自己紹介ページ」である", () => {
      expect(document.title).toBe("自己紹介ページ");
    });

    it("html lang 属性が「ja」である", () => {
      expect(document.documentElement.lang).toBe("ja");
    });

    it("meta charset が「UTF-8」である", () => {
      const charset = document.querySelector("meta[charset]")?.getAttribute("charset");
      expect(charset?.toUpperCase()).toBe("UTF-8");
    });
  });

  describe("HTML構造", () => {
    it("h1 が1つだけ存在する", () => {
      expect(document.querySelectorAll("h1")).toHaveLength(1);
    });

    it("highlight カードが4件存在する", () => {
      expect(document.querySelectorAll(".highlight")).toHaveLength(4);
    });

    it("highlights section の aria-label が「注目ポイント」である", () => {
      const section = document.querySelector(".highlights");
      expect(section?.getAttribute("aria-label")).toBe("注目ポイント");
    });
  });

  describe("コンテンツ検証", () => {
    it("eyebrow テキストに「GitHub Actions 練習用プロジェクト」が含まれる", () => {
      const eyebrow = document.querySelector(".eyebrow");
      expect(eyebrow?.textContent).toContain("GitHub Actions 練習用プロジェクト");
    });

    it("lead テキストに「Web制作と自動化」が含まれる", () => {
      const lead = document.querySelector(".lead");
      expect(lead?.textContent).toContain("Web制作と自動化");
    });

    it("highlight-label が正しい順序で並んでいる", () => {
      const labels = Array.from(document.querySelectorAll(".highlight-label")).map(
        (el) => el.textContent?.trim(),
      );
      expect(labels).toEqual(["Focus", "Now", "Goal", "Alert"]);
    });
  });

  describe("Alertカード", () => {
    it("highlight-alert クラスを持つカードが存在する", () => {
      const alertCard = document.querySelector(".highlight.highlight-alert");
      expect(alertCard).not.toBeNull();
    });
  });

  redCheck("does not render any text in red", () => {
    const html = readFileSync(resolve("index.html"), "utf8");
    const css = readFileSync(resolve("style.css"), "utf8");
    const redDom = new JSDOM(html, { pretendToBeVisual: true });
    const { document: redDocument } = redDom.window;

    const style = redDocument.createElement("style");
    style.textContent = css;
    redDocument.head.appendChild(style);

    const textNodes = Array.from(redDocument.querySelectorAll("body *")).filter(
      (element) => (element.textContent ?? "").trim().length > 0,
    );

    for (const element of textNodes) {
      const rgb = parseRgb(redDom.window.getComputedStyle(element).color);

      if (rgb) {
        expect(isRedLike(rgb)).toBe(false);
      }
    }
  });
});
