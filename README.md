# ⬡ DevBox — Browser-Based Coding Sandbox

A full-stack MERN application that provides a browser-based IDE where developers can create, edit, and preview web projects entirely from the browser — no local setup required.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas URI)

### Setup

```bash
# 1. Clone / extract the project
cd devbox

# 2. Install all dependencies (root + server + client)
npm run install:all

# 3. Configure server environment
cd server
cp .env.example .env
# Edit .env and set MONGO_URI if needed

# 4. Run both server and client
cd ..
npm run dev
```

- **Client**: http://localhost:3000
- **Server API**: http://localhost:5000/api
- **Health check**: http://localhost:5000/api/health

> **No MongoDB?** The server gracefully starts in demo mode — the app works but data won't persist between server restarts. For persistence, use MongoDB Atlas (free tier) and paste your URI into `.env`.

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Zustand | Component-driven UI, minimal global state boilerplate |
| Editor | Monaco Editor (`@monaco-editor/react`) | Same engine as VS Code — syntax highlighting, autocomplete |
| Backend | Express.js + Node.js | Lightweight REST API, easy Socket.IO integration |
| Database | MongoDB + Mongoose | Schema-flexible document store — projects are naturally nested JSON |
| Real-time | Socket.IO | WebSocket abstraction for live file sync across browser tabs |
| Layout | react-resizable-panels | Drag-to-resize IDE panes, zero configuration |
| State Persistence | Zustand `persist` middleware | Saves lightweight UI preferences to localStorage |

### Project Structure

```
devbox/
├── server/
│   ├── index.js              # Express + Socket.IO + MongoDB bootstrap
│   ├── models/
│   │   └── Project.js        # Mongoose schema (Project + embedded Files + Packages)
│   └── routes/
│       ├── projects.js       # CRUD for projects, template seeding
│       ├── files.js          # CRUD for files within a project
│       └── packages.js       # NPM package metadata + CDN URL resolution
│
└── client/src/
    ├── store/
    │   └── useStore.js       # Zustand store — single source of truth
    ├── hooks/
    │   └── useSocket.js      # Socket.IO connection + event handlers
    ├── utils/
    │   └── previewBuilder.js # HTML srcdoc assembly from file tree
    └── components/
        ├── Dashboard/        # Project list, create/delete modals
        ├── FileTree/         # Recursive file explorer, rename/delete
        ├── Editor/           # Monaco Editor with tab system + IDELayout
        ├── Preview/          # Iframe preview + PackagePanel
        └── Toolbar/          # Top bar — save, packages, nav
```

---

## 🔑 Key Architectural Decisions

### 1. Embedded Documents for Files
Files are stored **inside the Project document** as a subdocument array rather than a separate `Files` collection. This makes loading a project a single DB query and avoids join complexity. Trade-off: very large projects (100s of large files) would hit MongoDB's 16MB document limit — for a production system you'd want a separate collection with a `projectId` foreign key.

### 2. Live Preview via `srcdoc` + Inlining
The preview runs entirely inside a sandboxed `<iframe srcdoc="...">`. When the user edits code, `previewBuilder.js` assembles all the project's files into a single HTML document — inlining CSS via `<style>` and JS via `<script>` — and passes it as `srcdoc`. This gives true browser-native execution without any server round-trip.

**Why `srcdoc` over a server endpoint?** No latency — it's pure client-side. The server only persists files; the preview is built in-memory.

### 3. Optimistic Updates + Debounced Saves
File content changes are applied **immediately to local state** (optimistic update) so the UI feels instant. A 600ms debounce timer handles the actual API call. This means the editor is always responsive even on slow networks.

### 4. NPM Packages via CDN (unpkg)
"Installing" a package doesn't run `npm install` in a container — that would require significant infrastructure. Instead, the server resolves the latest version from the npm registry, then the preview injects `<script src="https://unpkg.com/package@version">` tags. This covers 90% of use cases for client-side libraries (lodash, axios, chart.js, anime.js, etc.) without container orchestration complexity.

### 5. Real-Time via Socket.IO Rooms
Each project gets its own Socket.IO room (`project:${id}`). When a file changes, the server broadcasts to all other clients in the room. This enables live collaboration — two people editing the same project will see each other's changes.

### 6. State Management with Zustand
Zustand was chosen over Redux for its minimal boilerplate. The entire app state — projects, files, tabs, packages, UI flags — lives in one store (`useStore.js`). The `persist` middleware saves only lightweight UI preferences (theme, sidebar width) to localStorage, not full file content.

---

## 📦 Features

- ✅ **File Explorer** — create, rename, delete files and folders with recursive tree
- ✅ **Monaco Editor** — VS Code engine with syntax highlighting for JS, HTML, CSS, JSX, TS, Python, JSON, Markdown
- ✅ **Tab System** — open multiple files simultaneously, close tabs independently
- ✅ **Live Preview** — real-time iframe preview updates as you type (600ms debounce)
- ✅ **Project Templates** — Vanilla JS, React (via CDN + Babel), Blank
- ✅ **NPM Package Manager** — install packages from unpkg CDN with version resolution
- ✅ **Session Persistence** — last opened file remembered per project in MongoDB
- ✅ **Real-Time Sync** — Socket.IO broadcasts file changes to other browser tabs
- ✅ **Error Overlay** — runtime JS errors shown inside preview with line numbers
- ✅ **Resizable Panels** — drag to resize explorer / editor / preview
- ✅ **Open in New Tab** — export current preview to a standalone browser tab

---

## 🤖 AI Usage Strategy

### Tools Used
- **Claude (Anthropic)** — primary development tool
- **Cursor** — inline code completion during iteration

### What AI Accelerated

| Task | How AI helped |
|---|---|
| Boilerplate generation | Scaffolded Express routes, Mongoose schemas, React component shells in seconds |
| `previewBuilder.js` | The regex patterns for inlining `<link>` and `<script>` tags would have taken 2-3 hours of debugging manually; AI produced a working version in one prompt |
| CSS architecture | Generated cohesive dark-theme CSS variables and component styles from a single description |
| Zustand store design | Helped structure the store with proper action separation and optimistic update patterns |
| Socket.IO room pattern | Confirmed the broadcast-to-room pattern for multi-tab sync |

### Where I Reasoned Through Things Manually

- **The `srcdoc` vs server-endpoint decision** — needed to think through latency implications and iframe sandbox attributes (`allow-scripts`, `allow-same-origin`) and what they meant for security
- **Embedded vs relational file storage** — the 16MB MongoDB document limit tradeoff required manual evaluation
- **Debounce timing** — 600ms felt right after manual testing; too short causes excessive API calls, too long makes the preview feel stale
- **Package CDN approach** — decided against spinning up containers (StackBlitz/CodeSandbox approach) as overkill for this scope; CDN covers the real-world use cases

### Prompt Engineering Examples

**Scaffolding:**
> "Build an Express route file for project CRUD. Projects have embedded file subdocuments. Each file has: id (uuid), name, path, type (file/folder), content, language, parentId. Include template seeding for vanilla/react/blank templates."

**Preview Builder:**
> "Write a function `buildPreviewDoc(files, packages)` that takes a project's file array and builds an HTML string for iframe srcdoc. It should inline CSS from `<link>` tags and JS from `<script src>` tags by finding matching files. Add an error overlay script."

**Not AI-generated:** Architecture decisions, the tradeoff analysis in the README, and all debugging of edge cases (e.g., the JSX Babel src replacement needing a different regex from the JS replacement).

---

## ⚠️ Known Limitations & Tradeoffs

| Limitation | Why / Tradeoff |
|---|---|
| No server-side code execution | Running Node.js in browser requires WASM runtimes (WebContainers) — out of scope |
| Package CDN only covers ESM/UMD browser builds | CommonJS-only packages (e.g. `fs`, `path`) won't work |
| 16MB MongoDB document limit | For projects with many large files; solvable with a separate Files collection |
| No auth/multi-user isolation | All projects visible to all users; would need JWT auth in production |
| Preview requires index.html | Projects without an HTML entry point show a placeholder |
| No TypeScript transpilation | TS files are treated as JS in the preview; no type checking |

---

## 🗺️ Potential Extensions

- **WebContainers (StackBlitz SDK)** — run Node.js in browser for server-side projects
- **GitHub OAuth + Gist sync** — save/load projects from GitHub
- **Multi-cursor collaboration** — Yjs CRDT + Socket.IO for real Google Docs-style editing
- **AI code completion** — pipe Monaco `onChange` through Claude API for inline suggestions
- **Docker sandbox** — run arbitrary code in isolated containers via a sidecar service

---

## 🎥 Video Walkthrough Script

### Opening (30 seconds)
*"I'm going to walk you through DevBox — a browser-based coding sandbox I built with the MERN stack. The goal: give developers a CodeSandbox-like environment where they can create, edit, and preview projects with zero local setup. Let me show you what it does, then explain how I built it and how I used AI."*

### Demo (2 minutes)
1. Show the Dashboard — "This is the project list. Projects persist in MongoDB."
2. Create a new Vanilla JS project — show template seeding
3. Edit `script.js` — show the live preview updating
4. Create a new file — show the file tree
5. Open the Package Manager — install `anime.js`, use it in `script.js`, see it work in preview
6. Open in new tab button
7. Open a second browser tab on the same project — edit a file in tab 1, show it appears in tab 2 (Socket.IO)

### Architecture Walkthrough (2 minutes)
1. **Backend**: `server/index.js` — "Express, Socket.IO rooms, MongoDB. The key design choice: files are embedded in the Project document — one query to load everything."
2. **Preview**: `previewBuilder.js` — "This is the heart of it. It assembles all files into one HTML string, inlines CSS and JS, and passes it as `srcdoc` to an iframe. No server round-trip."
3. **State**: `useStore.js` — "Zustand gives me one store for everything. Optimistic updates make it feel instant; a 600ms debounce handles the actual save."
4. **Socket.IO**: — "Each project is a room. File changes broadcast to other clients — that's how the two-tab sync works."

### AI Workflow (1.5 minutes)
1. *"I used Claude as my primary tool. The biggest win was `previewBuilder.js` — those regex patterns for rewriting `<link>` and `<script>` tags would have taken hours manually. I gave Claude a precise spec and it produced working code on the first try."*
2. *"But I didn't just copy blindly. I made deliberate architectural decisions — like using `srcdoc` instead of a server endpoint, choosing embedded documents over a separate files collection, and the CDN approach for packages. Those required me to reason through tradeoffs the AI couldn't make for me."*
3. *"AI accelerated the scaffolding; I drove the architecture."*

### Closing (30 seconds)
*"The known limitations: no server-side execution — that would require WebContainers or a Docker sidecar. No auth yet. But the core loop — create, edit, preview, persist — works end to end. I'd extend it with WebContainers for Node.js support and Yjs for real-time collaboration. Questions?"*
#   d e v b o x  
 