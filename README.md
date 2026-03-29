# GitSlop

**🌐 Live gallery: [codes-son.github.io/gitslop](https://codes-son.github.io/gitslop/)**

A GitHub App bot that replies to `@gitslopbot <keyword>` mentions in issue, PR, and discussion comments with a relevant GIF meme.

## How it works

1. Install the GitSlop GitHub App on a repository
2. In any issue, PR, or discussion comment, mention `@gitslopbot <keyword>`
3. The bot automatically searches Giphy for a relevant GIF and replies

Example:
```
@gitslopbot this code is garbage
```

The bot replies with a matching GIF.

## Gallery

All memes posted by the bot are displayed on the public gallery at **[codes-son.github.io/gitslop](https://codes-son.github.io/gitslop/)**.

## Stack

- **Backend:** Node.js + Express — handles GitHub webhooks, Giphy search, GitHub App auth
- **Frontend:** React + Vite — public meme gallery
- **Database:** PostgreSQL — stores all posted memes
- **Auth:** GitHub App JWT + installation tokens

## Environment Variables

| Variable | Description |
|---|---|
| `GITHUB_APP_ID` | Your GitHub App's App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key (PEM format) |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret set in GitHub App settings |
| `GIPHY_API_KEY` | Giphy API key |
| `DATABASE_URL` | PostgreSQL connection string |

## GitHub App Setup

1. Create a GitHub App at github.com/settings/apps/new
2. Set webhook URL to `https://<your-domain>/api/webhook/github`
3. Set webhook secret (save same value as `GITHUB_WEBHOOK_SECRET`)
4. Enable Repository permissions: **Issues** and **Pull Requests** → Read & Write, **Discussions** → Read & Write
5. Subscribe to events: **Issue comment**, **Pull request review comment**, **Discussion comment**
6. Generate a private key and save as `GITHUB_APP_PRIVATE_KEY`
7. Install the app on your repositories

## Development

```bash
pnpm install
pnpm run dev
```

Database schema push:
```bash
pnpm --filter @workspace/db run push
```
