# StudyOS

A Notion-style study platform with markdown notes, flashcards, pomodoro timer, and PDF-to-flashcards AI generation.

## Setup

### 1. Supabase (Required)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
4. Go to **Settings > API** and copy:
   - Project URL
   - Anon/public key

### 2. Environment Variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Adding Content

### Via Admin Panel (Recommended)

1. Go to http://localhost:3000/admin
2. Enter password: `studyos123`
3. Create courses, modules, notes, and reviewers

### Via Code

Create markdown/YAML files in `content/courses/`:

```
content/courses/
└── your-course/
    ├── meta.yaml
    └── module-01/
        ├── _index.md
        ├── note-1.md
        └── reviewers/
            └── reviewer-1.yaml
```

## Features

- **Markdown Notes** with syntax highlighting and `[[wiki-links]]`
- **Flashcard System** with SM-2 spaced repetition
- **Pomodoro Timer** with configurable durations
- **PDF to Flashcards** using OpenAI or Anthropic API
- **Dark Mode** toggle
- **Backlinks** panel showing references to current note
- **Notion-style Editor** for notes and flashcards
- **Persistent Storage** via Supabase (free tier)

## Deployment to Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables (Supabase URL + key)
4. Deploy

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- remark/rehype (markdown)
- Lucide React (icons)
