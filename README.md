# Expense Tracker

Install dependencies and start the frontend and API together:

```sh
npm install
npm run dev
```

The Vite app runs at `http://localhost:5173` and proxies `/api` requests to the Node API on port `3001`. Start only the API with `npm run api`.

The API stores account and expense data in `data/expense-tracker.json`. That file is created automatically and should be kept private and out of version control. Passwords are stored as salted scrypt hashes; login sessions use an HttpOnly cookie. Sessions are held in server memory and are cleared when the API restarts.
