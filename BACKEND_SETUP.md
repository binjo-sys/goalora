# Goalora cloud backend setup

Goalora's browser app is local-first. The optional cloud account system uses the Worker under `api/` and Cloudflare D1.

## D1

Create a D1 database named `goalora`, then run `api/schema.sql` against it.

Update `api/wrangler.toml` with the real D1 `database_id` and keep the binding name `DB`.

## Auth secret

Set a Worker secret named `SESSION_SECRET` to a long random value. Never commit this secret.

## Deploy

From the `api/` directory, use Wrangler to deploy the Worker. The Pages app can then be pointed at the deployed API origin using the `API_BASE_URL` setting used by the future cloud-sync client.

## Security notes

The Worker uses HTTP-only session cookies, hashed passwords, and user-scoped D1 records. Do not enable credential storage without HTTPS and a configured `SESSION_SECRET`.
