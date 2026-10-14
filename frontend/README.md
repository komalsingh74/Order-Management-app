# Food delivery frontend

## Run locally

1. Start MongoDB and the backend API from `../backend` (`npm install`, then
   `npm run dev`).
2. Copy `.env.example` to `.env.local`. The default API URL,
   `http://localhost:5000/api`, matches the backend's default port.
3. Install frontend dependencies and start Next.js:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set
`NEXT_PUBLIC_API_URL` to the deployed backend URL ending in `/api` when using
another environment.

The frontend uses the shared Axios client in `lib/api.ts` for menu, order
creation, cancellation, order lookup, and order-status streaming.

## Styling and UI

- Tailwind CSS utility classes are used throughout the app; the shared theme
  tokens and browser defaults live in `app/globals.css`.
- Tailwind is compiled with the `@tailwindcss/postcss` plugin configured in
  `postcss.config.mjs`.
- The reusable shadcn-style components live in `components/ui/`, and
  `lucide-react` supplies the interface icons.
- Checkout validation currently lives in `lib/validation.ts`; the frontend
  does not rely on Zod for that flow.
