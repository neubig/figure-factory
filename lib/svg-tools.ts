export type ReplaceOperation = {
  search: string;
  replace: string;
};

export function replaceInSvg(svg: string, operation: ReplaceOperation): string {
  if (!operation.search) {
    throw new Error("Search text cannot be empty.");
  }

  const occurrences = svg.split(operation.search).length - 1;
  if (occurrences === 0) {
    throw new Error("Search text was not found in the SVG.");
  }
  if (occurrences > 1) {
    throw new Error(`Search text matched ${occurrences} locations. Include more surrounding SVG to make it unique.`);
  }

  return svg.replace(operation.search, operation.replace);
}

export function validateSvg(svg: string): string {
  const trimmed = svg.trim();
  if (!trimmed.startsWith("<svg") || !trimmed.endsWith("</svg>")) {
    throw new Error("The document must be a complete <svg> element.");
  }
  if (/\<(script|iframe|object|embed|foreignObject)\b/i.test(trimmed)) {
    throw new Error("Unsafe embedded content is not allowed in SVG documents.");
  }
  if (/\bon\w+\s*=/i.test(trimmed) || /(?:href|src)\s*=\s*["']\s*javascript:/i.test(trimmed)) {
    throw new Error("Event handlers and JavaScript URLs are not allowed in SVG documents.");
  }
  return trimmed;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(validateSvg(svg))}`;
}
