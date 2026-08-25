"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Clipboard, Code2, Download, LoaderCircle, Settings2, Sparkles, Upload, X } from "lucide-react";
import { DEFAULT_SVG } from "@/lib/default-svg";
import { validateSvg } from "@/lib/svg-tools";

type Settings = { model: string; baseUrl: string; apiKey: string; hasApiKey: boolean };
type HistoryItem = { prompt: string; svg: string };

export function Studio() {
  const [svg, setSvg] = useState(DEFAULT_SVG);
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState<Settings>({ model: "gpt-4.1-mini", baseUrl: "https://api.openai.com/v1", apiKey: "", hasApiKey: false });
  const [showSettings, setShowSettings] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("Loading SVG editor…");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editorReady, setEditorReady] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const editorFrame = useRef<HTMLIFrameElement>(null);
  const editorSvg = useRef("");
  const editorReadyRef = useRef(false);
  const modelReadyRef = useRef(false);
  const settingsRef = useRef(settings);
  const settingsLoadedRef = useRef(false);


  const runPreflight = useCallback(async () => {
    setNotice("Checking model connection…");
    try {
      const response = await fetch("/api/preflight", { method: "POST" });
      const data = await response.json();
      modelReadyRef.current = response.ok && data.ready;
      setNotice(modelReadyRef.current ? "Ready to edit" : data.error || "Model connection failed");
      return modelReadyRef.current;
    } catch {
      modelReadyRef.current = false;
      setNotice("Model connection failed");
      return false;
    }
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then(async (data) => {
        const nextSettings = { ...settingsRef.current, ...data };
        settingsRef.current = nextSettings;
        settingsLoadedRef.current = true;
        setSettings(nextSettings);
        if (nextSettings.hasApiKey) await runPreflight();
        else if (editorReadyRef.current) setNotice("Add an API key for AI edits");
      })
      .catch(() => {
        settingsLoadedRef.current = true;
        if (editorReadyRef.current) setNotice("Add an API key for AI edits");
      });
  }, [runPreflight]);

  useEffect(() => {
    function receiveEditorMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== editorFrame.current?.contentWindow) return;
      if (event.data?.type === "figure-factory:ready") {
        editorReadyRef.current = true;
        setEditorReady(true);
        if (settingsLoadedRef.current) setNotice(modelReadyRef.current ? "Ready to edit" : settingsRef.current.hasApiKey ? "Checking model connection…" : "Add an API key for AI edits");
        editorFrame.current?.contentWindow?.postMessage({ type: "figure-factory:set-svg", svg }, window.location.origin);
      }
      if (event.data?.type === "figure-factory:changed") {
        try {
          const nextSvg = validateSvg(event.data.svg);
          editorSvg.current = nextSvg;
          setSvg(nextSvg);
          setNotice("Canvas edited");
        } catch {
          setNotice("SVG-Edit produced invalid source");
        }
      }
    }
    window.addEventListener("message", receiveEditorMessage);
    return () => window.removeEventListener("message", receiveEditorMessage);
  }, [svg]);

  useEffect(() => {
    if (!editorReady || svg === editorSvg.current) return;
    try {
      const validSvg = validateSvg(svg);
      editorSvg.current = validSvg;
      editorFrame.current?.contentWindow?.postMessage({ type: "figure-factory:set-svg", svg: validSvg }, window.location.origin);
    } catch {
      // Source mode can be temporarily invalid while the user is typing.
    }
  }, [editorReady, svg]);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "Could not save settings");
    const nextSettings = { ...settings, apiKey: "", hasApiKey: data.hasApiKey };
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    if (await runPreflight()) setShowSettings(false);
  }

  async function editSvg(event?: FormEvent) {
    event?.preventDefault();
    if (!prompt.trim() || working) return;
    if (!settings.hasApiKey) {
      setShowSettings(true);
      return setNotice("Add an API key to begin");
    }
    if (!(await runPreflight())) {
      setShowSettings(true);
      return;
    }
    setWorking(true);
    setNotice("Directing the model…");
    try {
      const response = await fetch("/api/edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, svg }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The edit failed.");
      setHistory((items) => [{ prompt, svg }, ...items].slice(0, 8));
      setSvg(validateSvg(data.svg));
      setPrompt("");
      setNotice(data.summary || "Canvas updated");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The edit failed.");
    } finally {
      setWorking(false);
    }
  }

  function onPromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") editSvg();
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSvg(validateSvg(await file.text()));
      setHistory([]);
      setNotice(`${file.name} imported`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invalid SVG file");
    }
    event.target.value = "";
  }

  async function pasteSvg() {
    try {
      setSvg(validateSvg(await navigator.clipboard.readText()));
      setHistory([]);
      setNotice("SVG pasted from clipboard");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Clipboard does not contain valid SVG");
    }
  }

  async function copySvg() {
    await navigator.clipboard.writeText(svg);
    setNotice("SVG source copied");
  }

  function downloadSvg() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    link.download = "figure-factory.svg";
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice("SVG downloaded");
  }

  return (
    <main className="studio-shell">
      <header className="topbar">
        <a className="wordmark" href="#canvas" aria-label="Figure Factory home"><span className="wordmark-mark">FF</span><span>Figure<br />Factory</span></a>
        <form className="prompt-form" onSubmit={editSvg}>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={onPromptKeyDown} placeholder="Describe an SVG edit…" aria-label="Describe an SVG edit" />
          <button className="make-button" disabled={working || !prompt.trim()} aria-label="Apply SVG edit">{working ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={16} />}<span>Make it</span></button>
        </form>
        <div className="status"><span className={working ? "status-dot active" : "status-dot"} />{notice}</div>
        <button className="model-pill" onClick={() => setShowSettings(true)}><span>{settings.model}</span><ChevronDown size={14} /></button>
      </header>

      <section id="canvas" className="canvas-section" aria-labelledby="canvas-heading">
        <div className="canvas-toolbar">
          <div><span className="section-index">02 / CANVAS</span><h2 id="canvas-heading">Live artwork</h2></div>
          <div className="tool-group">
            <input ref={fileInput} type="file" accept="image/svg+xml,.svg" onChange={importFile} hidden />
            <button onClick={() => fileInput.current?.click()} title="Upload SVG"><Upload size={17} /><span>Import</span></button>
            <button onClick={pasteSvg} title="Paste SVG"><Clipboard size={17} /><span>Paste</span></button>
            <button onClick={() => setShowCode(true)} title="Edit source"><Code2 size={17} /><span>Source</span></button>
            <button onClick={copySvg} title="Copy source"><Check size={17} /><span>Copy</span></button>
            <button className="download-button" onClick={downloadSvg}><Download size={17} /><span>Download</span></button>
          </div>
        </div>
        <div className="canvas-stage">
          <iframe ref={editorFrame} className="svg-editor" src="/svgedit/index.html" title="Interactive SVG editor" />
          {!editorReady && <div className="editor-loading"><LoaderCircle className="spin" size={22} />Loading SVG-Edit</div>}
          {working && <div className="working-overlay"><div className="scanline" /><span>RECOMPOSING</span></div>}
        </div>
        {history.length > 0 && <div className="history-strip"><span>UNDO</span>{history.map((item, index) => <button key={`${item.prompt}-${index}`} onClick={() => { setSvg(item.svg); setHistory((items) => items.slice(index + 1)); setNotice("Previous version restored"); }}>{item.prompt}</button>)}</div>}
      </section>

      {showSettings && <div className="modal-backdrop" onMouseDown={() => setShowSettings(false)}><form className="modal" onSubmit={saveSettings} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow"><Settings2 size={14} /> CONNECTION</p><h2>Choose your model</h2></div><button type="button" className="icon-button" onClick={() => setShowSettings(false)}><X /></button></div><label>MODEL ID<input value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} placeholder="gpt-4.1-mini" /></label><label>OPENAI-COMPATIBLE BASE URL<input value={settings.baseUrl} onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })} placeholder="https://api.openai.com/v1" /></label><label>API KEY<input type="password" value={settings.apiKey} onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })} placeholder={settings.hasApiKey ? "Saved — enter to replace" : "sk-…"} /></label><p className="privacy-note">Your key is stored in a secure, HttpOnly browser cookie and is never returned to client-side JavaScript after saving.</p><button className="save-button">Save connection</button></form></div>}
      {showCode && <div className="modal-backdrop" onMouseDown={() => setShowCode(false)}><div className="modal code-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow"><Code2 size={14} /> SOURCE</p><h2>Edit the SVG</h2></div><button className="icon-button" onClick={() => setShowCode(false)}><X /></button></div><textarea value={svg} onChange={(event) => setSvg(event.target.value)} spellCheck={false} /><button className="save-button" onClick={() => { try { setSvg(validateSvg(svg)); setShowCode(false); setNotice("Source updated"); } catch (error) { setNotice(error instanceof Error ? error.message : "Invalid SVG"); } }}>Apply source</button></div></div>}
    </main>
  );
}
