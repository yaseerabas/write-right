# WriteRight

A focused writing workspace with AI-assisted generation, editing, summarization, and rewriting.

## Overview

WriteRight is a browser-based writing tool that helps you draft, refine, and restructure text with an LLM backend. It keeps your workflow simple: enter text on the left, get results on the right. No signup, no clutter.

## Features

- **Generate** — Write from a prompt with adjustable tone (professional, casual, creative, academic) and length (short, medium, long)
- **Edit** — Improve clarity, fix grammar, make concise, or expand ideas
- **Tools** — Summarize, rewrite, simplify, convert to bullet points, extract keywords, generate CTAs, brainstorm ideas, and create social media posts
- **History** — Every generation is saved locally with search and export
- **Keyboard shortcuts** — Ctrl+Enter to generate, Ctrl+Shift+C to copy output
- **Dark mode** — Matches your system preference
- **Auto-save drafts** — Never lose work in the input field

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Router
- Vitest

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- An OpenAI-compatible API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-writting-assistant

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Configuration

Edit `.env` and add your LLM credentials:

```env
VITE_LLM_API_KEY=your-api-key
VITE_LLM_PROVIDER=openai
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_MODEL=gpt-4o-mini
```

Supported providers: OpenAI, Groq, or any OpenAI-compatible API.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Building for Production

```bash
npm run build
```

Output goes to `dist/`. Preview it with:

```bash
npm run preview
```

### Running Tests

```bash
# Unit tests
npm run test

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Generate text |
| `Ctrl + Shift + C` | Copy output |
| `Ctrl + /` or `?` | Show keyboard shortcuts |
| `Escape` | Close modals / drawers |

## Project Structure

```
src/
├── components/        # UI components (shadcn + custom)
├── components/ui/     # shadcn/ui primitives
├── hooks/             # Custom React hooks
├── pages/             # Route pages
├── services/          # LLM service layer
├── utils/             # Utilities (toast, validation, performance)
├── globals.css        # Global styles + theme tokens
└── main.tsx           # Entry point
public/
├── favicon.ico
├── favicon-*.png
├── apple-touch-icon.png
├── write-right-light.png
└── write-right-dark.png
```

## License

MIT
