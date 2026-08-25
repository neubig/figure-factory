import { describe, expect, it } from "vitest";
import { replaceInSvg, validateSvg } from "./svg-tools";

const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="red"/></svg>';

describe("replaceInSvg", () => {
  it("replaces one exact span", () => expect(replaceInSvg(svg, { search: 'fill="red"', replace: 'fill="blue"' })).toContain('fill="blue"'));
  it("rejects missing spans", () => expect(() => replaceInSvg(svg, { search: "circle", replace: "path" })).toThrow("not found"));
  it("rejects ambiguous spans", () => expect(() => replaceInSvg("<svg><g/><g/></svg>", { search: "<g/>", replace: "<path/>" })).toThrow("2 locations"));
});

describe("validateSvg", () => {
  it("accepts complete SVG documents", () => expect(validateSvg(`  ${svg}  `)).toBe(svg));
  it.each(["<div />", "<svg><script /></svg>", '<svg><rect onclick="alert(1)"/></svg>', '<svg><a href="javascript:x"/></svg>'])("rejects unsafe or invalid source: %s", (source) => expect(() => validateSvg(source)).toThrow());
});
