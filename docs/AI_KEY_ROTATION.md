# AI provider API key rotation

The Gemini, OpenAI, Groq, and OpenRouter adapters accept the existing
`<PROVIDER>_API_KEY` variable and numbered variants such as
`<PROVIDER>_API_KEY_2` and `<PROVIDER>_API_KEY_3`. Empty values are ignored.
Keys are read only by server-side router configuration. Startup diagnostics and
the development-only `/api/debug-ai` endpoint report key counts, never values.

In development, `POST /api/debug-ai/health` manually checks configured
providers using a short `OK` prompt with a 32-token output limit, minimal
Gemini thinking, and a five-second timeout per key.
`GET /api/debug-ai/health` returns the most recent checks in the current
process without making provider requests. Both routes are disabled outside
development. Health results include configuration, sanitized status,
timestamp, duration, and whether a healthy provider is eligible as a fallback;
they never include generated content or key material. Checks are not automatic.
Last-check metadata is process-local and may not survive a serverless cold
start or be shared across instances.

Each provider rotates its configured keys round-robin. One request attempts
each eligible key at most once, with the existing per-attempt timeout and
overall router deadline. HTTP 401 marks a key invalid for the current process;
HTTP 429 honors `Retry-After` when supplied (otherwise exponential backoff is
used); timeouts, network errors, and HTTP 5xx use bounded exponential backoff.
Other HTTP 4xx responses are not retried with another key.

Key health and rotation cursors are held in process memory. There is no
configured shared persistent status store for provider keys, and this phase
does not add one or store key material in Firestore. On Vercel/serverless,
warm instances may retain status and rotation state independently, while cold
starts and other instances begin with fresh state. Consequently, cooldowns and
invalid-key suppression are best-effort per warm instance, not guaranteed
across instances. Per-request attempts remain bounded and unique regardless
of instance state.

HTTP failures are classified without retaining response bodies: 401 invalid
key, 403 permission/access, 404 model/endpoint unavailable, 429 quota exhausted
or temporary rate limit (based on a small allowlist of provider error codes),
and 5xx temporary provider failure. Quota exhaustion uses a longer bounded
cooldown; rate limiting honors `Retry-After` and otherwise uses bounded
exponential backoff. Provider diagnostics do not include keys, response bodies,
or user prompts.
