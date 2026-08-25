import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/svgedit/dist/editor");
const target = resolve(root, "public/svgedit");

await rm(target, { recursive: true, force: true });
await mkdir(dirname(target), { recursive: true });
await cp(source, target, { recursive: true });
await writeFile(resolve(target, "index.html"), `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link href="./svgedit.css" rel="stylesheet">
  <title>Figure Factory SVG Editor</title>
</head>
<body style="margin:0;overflow:hidden">
  <div id="container" style="width:100%;height:100vh"></div>
  <script type="module">
    import Editor from './Editor.js';
    const editor = new Editor(document.getElementById('container'));
    editor.setConfig({ allowInitialUserOverride: false, extensions: [], noDefaultExtensions: false });
    editor.init();
    editor.ready(() => {
      window.svgEditor = editor;
      window.svgCanvas = editor.svgCanvas;
      editor.svgCanvas.bind('changed', () => {
        window.parent.postMessage({ type: 'figure-factory:changed', svg: editor.svgCanvas.getSvgString() }, window.location.origin);
      });
      window.parent.postMessage({ type: 'figure-factory:ready' }, window.location.origin);
    });
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'figure-factory:set-svg') return;
      editor.svgCanvas?.setSvgString(event.data.svg, true);
    });
  </script>
</body>
</html>`);
