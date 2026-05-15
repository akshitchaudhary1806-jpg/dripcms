# DRIP CULTURE — Full Stack Website

```
dripcms-full/
├── frontend/
│   └── index.html          ← Complete website (HTML + CSS + JS)
├── backend/
│   ├── server.js           ← Express API + serves frontend
│   ├── package.json
│   └── data/
│       └── db.json         ← JSON database (auto-created on first run)
├── .gitignore
└── README.md
```

---

## Run Locally (2 steps)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start the server
npm start
```

Open http://localhost:3001 — the full website loads with a live backend.

For auto-restart during development:
```bash
npm run dev
```

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/stats` | Dashboard totals & revenue |
| POST | `/api/auth/signup` | `{ name, email, password, phone }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | `{ name, phone, email, address }` |
| GET | `/api/customers/:id` | Get one customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/orders` | List all orders (optional `?status=Pending`) |
| POST | `/api/orders` | `{ name, phone, address, product, size, qty, amount, status }` |
| GET | `/api/orders/:id` | Get one order |
| PUT | `/api/orders/:id` | Update order / status |
| DELETE | `/api/orders/:id` | Delete order |

---

## Deploy to a VPS (e.g. DigitalOcean, AWS EC2)

```bash
# On your server
git clone <your-repo>
cd dripcms-full/backend
npm install --production
npm start

# Keep alive with PM2
npm install -g pm2
pm2 start server.js --name dripcms
pm2 save
pm2 startup
```

## Deploy to Railway / Render (free tier)

1. Push this repo to GitHub
2. Connect repo to Railway or Render
3. Set **Root Directory** to `backend`
4. Set **Start Command** to `npm start`
5. Set **PORT** environment variable if needed

## Deploy to Vercel (serverless)

Vercel works best for static frontends. For this full-stack app use Railway, Render, or Fly.io instead — they support persistent file storage needed for `db.json`.

---

## Production Checklist

- [ ] Hash passwords with `bcrypt` (currently plain text)
- [ ] Add JWT tokens for auth sessions
- [ ] Switch `lowdb` to PostgreSQL for scale
- [ ] Add `helmet` for security headers
- [ ] Add `express-rate-limit` for rate limiting
- [ ] Set up HTTPS (auto on Railway/Render)
- [ ] Move `PORT` to `.env` file
