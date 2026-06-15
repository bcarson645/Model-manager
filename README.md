# Model Manager

Prompt-driven interface builder for model management. Built with Next.js and ready to deploy on [Vercel](https://vercel.com).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub (`bcarson645/Model-manager`).
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the **Model-manager** repository.
4. Vercel auto-detects Next.js — leave defaults and click **Deploy**.

No extra build settings are required. Framework preset: **Next.js**, build command: `npm run build`, output: `.next`.

## Project structure

- `app/page.tsx` — main page
- `components/PromptBuilder.tsx` — prompt input and preview UI
- `app/api/prompt/route.ts` — API stub that turns prompts into layout structures

## Next steps

- Connect an LLM API key in Vercel environment variables
- Replace the stub in `/api/prompt` with real generation logic
- Add your model management data sources and auth
