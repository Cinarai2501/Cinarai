# AI provider production setup

The router priority is Gemini, Groq, OpenRouter, then OpenAI. Configure at least
one valid provider key; configure all four when possible so the router has
fallback options. Provider keys are server-side only and must not use a
`NEXT_PUBLIC_` prefix.

| Provider | Required variable | Optional additional keys |
| --- | --- | --- |
| Gemini | `GEMINI_API_KEY` | `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` |
| Groq | `GROQ_API_KEY` | `GROQ_API_KEY_2`, `GROQ_API_KEY_3` |
| OpenRouter | `OPENROUTER_API_KEY` | `OPENROUTER_API_KEY_2`, `OPENROUTER_API_KEY_3` |
| OpenAI | `OPENAI_API_KEY` | `OPENAI_API_KEY_2`, `OPENAI_API_KEY_3` |

Use the provider console to create each key and keep the values in a secret
manager. Do not copy real values into source files, commits, tickets, or logs.
The checked-in `.env.example` contains empty placeholders only.

## Local development

Set the provider keys in `.env.local` at the repository root. Restart the
development server after changing them. Do not expose provider keys through
client-side configuration.

## Vercel

In the Vercel project, open **Settings → Environment Variables** and add the
required names separately for the **Development**, **Preview**, and
**Production** environments that should use them. Add the same optional
numbered variables when using multiple keys. Use distinct provider keys for
each deployment environment when practical; preview deployments should not
silently consume production-only credentials.

After changing environment variables, redeploy the relevant environment so
the serverless functions receive the updated values. This repository does not
configure Vercel settings or deploy changes automatically.

## Model defaults and health checks

Gemini uses the stable `gemini-3.6-flash` model with the `v1beta` REST
`models/{model}:generateContent` endpoint and sends its API key in
`x-goog-api-key`, not in a URL. The adapter uses low thinking for normal
requests and minimal thinking for the health probe because output token limits
also include thinking tokens. The previous default,
`gemini-2.0-flash`, was shut down June 1, 2026; this explains the model-not-found
404 seen in the prior health check. Groq uses
`llama-3.3-70b-versatile`; OpenRouter uses `openai/gpt-4o-mini`; OpenAI uses
`gpt-4o-mini`. Provider model defaults can be changed through the server-side
router's provider config; this project does not currently expose model names
as environment variables.

The Gemini endpoint/model and shutdown information were checked against
[Google's model list](https://ai.google.dev/gemini-api/docs/models) and
[deprecation schedule](https://ai.google.dev/gemini-api/docs/deprecations).
The OpenAI error-code mapping follows
[OpenAI's API error reference](https://developers.openai.com/api/docs/guides/error-codes).
Groq's key convention and OpenRouter's endpoint are documented in the
[Groq quickstart](https://console.groq.com/docs/quickstart) and
[OpenRouter API reference](https://openrouter.ai/docs/api/reference/overview).

`POST /api/debug-ai/health` is a development-only, manual check. It sends a
small prompt (maximum 32 output tokens) to each configured provider/key
sequentially and applies a five-second timeout per key. Each check can consume
provider quota. `GET` reads only the latest in-process results. Do not schedule
the manual check as a continuous production probe.

## Runtime limitations

Each generation request has a 35-second global deadline and at most an
8-second timeout per provider attempt, apportioned across remaining keys.
Provider retries are finite and each configured key is attempted at most once
per request. `Retry-After` is recorded for future attempts; the router does not
sleep before trying a different provider. Exponential cooldown state and
round-robin cursors are in process memory, so Vercel cold starts and separate
instances do not share cooldowns, invalid-key status, or cursors. Concurrent
requests are not globally deduplicated and can race on the same key. No
distributed state store is configured by this project.

Provider-backed learning endpoints require a Firebase ID token and a server
profile with the `student` role. They share a Firestore-backed per-UID request
window in the existing `users/{uid}/guruAiRateLimits` subcollection; configure
`AI_USER_RATE_LIMIT_MAX_REQUESTS` and `AI_USER_RATE_LIMIT_WINDOW_MS` to adjust
the default 20 requests per minute. This quota is stored server-side and is
shared across serverless instances. Invalid requests are rejected before they
consume the quota. Guru dashboard analysis uses its separate scoped limits.
