export const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
  <title id="title">Figure Factory welcome canvas</title>
  <desc id="desc">A warm editorial composition inviting the user to shape an idea.</desc>
  <defs>
    <linearGradient id="sunset" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff5c35"/>
      <stop offset="1" stop-color="#ffb347"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#13110f" flood-opacity=".18"/>
    </filter>
  </defs>
  <rect width="1200" height="720" fill="#f3efe6"/>
  <circle cx="1010" cy="120" r="210" fill="#ddd5c5"/>
  <path d="M0 574 C250 470 430 680 720 548 S1040 420 1200 510 V720 H0Z" fill="#1f3d33"/>
  <g filter="url(#soft-shadow)">
    <rect x="94" y="92" width="760" height="410" rx="8" fill="#fffdf8"/>
    <rect x="94" y="92" width="14" height="410" fill="url(#sunset)"/>
  </g>
  <text x="158" y="190" fill="#e64a2e" font-family="ui-monospace, monospace" font-size="18" letter-spacing="4">FIGURE FACTORY / 001</text>
  <text x="154" y="292" fill="#171512" font-family="Georgia, serif" font-size="74" font-weight="700">Shape an idea.</text>
  <text x="158" y="360" fill="#645f57" font-family="ui-sans-serif, sans-serif" font-size="24">Describe the change. The canvas follows.</text>
  <g transform="translate(158 414)">
    <circle cx="16" cy="16" r="16" fill="url(#sunset)"/>
    <path d="M10 16h12M17 9l7 7-7 7" fill="none" stroke="#fff" stroke-width="2"/>
    <text x="50" y="23" fill="#171512" font-family="ui-monospace, monospace" font-size="18">Try “turn this into a lunar field guide”</text>
  </g>
</svg>`;
