# Food delivery backend

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and configure `MONGO_URI` if MongoDB is not
   running at the local default.
3. Start the API with `npm run dev` (or `npm start`).

The API listens on port `5000` by default. The frontend's
`NEXT_PUBLIC_API_URL` should point to this server and end with `/api`.

The backend uses native ES modules; relative imports include their `.js`
extensions. Useful scripts:

- `npm run seed` resets the menu data.
- `npm test` runs the Jest suite in ESM mode.
