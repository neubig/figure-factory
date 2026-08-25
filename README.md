# Figure Factory

An AI-directed SVG studio built with Next.js, TypeScript, the Vercel AI SDK, and OpenAI-compatible model providers.

## Features

- Prompt-driven SVG edits with targeted `replace_svg` and full-document `write_svg` tools
- Any OpenAI-compatible model, base URL, and API key
- API keys stored in secure, HttpOnly cookies
- Live SVG canvas with source editing and undo history
- SVG upload, paste, copy, and download workflows
- Validation against scripts, event handlers, and unsafe embedded content
- Responsive, accessible interface ready for Vercel

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), select the model control, and save your provider configuration.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Deploy

Import the repository into Vercel or run `vercel`. No server environment variables are required because each user supplies provider credentials through the settings dialog.
