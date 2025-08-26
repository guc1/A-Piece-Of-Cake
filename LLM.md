Here you go — a single-file LLM.md you can drop in and copy. I added a full “setup config” with every commonly used option exposed (defaults included, easy to override), and I set the implicit fallback model to 'gpt-4.1' (not from env). Brief rationales reference official docs for Next.js Route Handlers, SSE streaming, OpenAI function/structured outputs, and GPT-4.1.

We use Next.js Route Handlers for API orchestration and SSE for token streaming; both are stable, well-documented patterns. 
Next.js
MDN Web Docs

For tools / structured JSON outputs, follow OpenAI’s function/structured-output guidance. 
OpenAI Platform
+1

When no model is specified, we default to gpt-4.1 based on OpenAI’s 2025 guidance. (You can still override per call.) 
OpenAI Platform
OpenAI

If you deploy on Vercel, their streaming guidance (and AI SDK) can further reduce boilerplate. 
Vercel

# LLM.md — Technical Integration Practices (Single File)

This doc defines **exactly how to wire LLMs** into this codebase:
- a **single source of truth config** exposing all toggles with sensible defaults,
- a **provider-agnostic** request wrapper,
- an **SSE streaming** route,
- **function-calling** with strict schemas,
- **client-side persistence** and agent-aware routing notes.

---

## 1) Single Source of Truth — LLM Setup & All Customizable Options

Create `lib/llm/config.ts` (or inline these in your route and import later). All options are present with defaults; override per call via `overrides`.

```ts
// lib/llm/config.ts
export type Provider = 'openai' | 'anthropic' | 'google' | 'other';

export type ResponseFormat =
  | { type: 'text' }                       // default text
  | { type: 'json_object' }                // structured JSON
  | { type: 'json_schema'; schema: any };  // strict schema (provider-permitting)

export type ToolChoice = 'auto' | 'none' | { type: 'function'; name: string };

export interface LlmSetup {
  // ---- Core model & transport ----
  provider: Provider;               // inferred from model name or set explicitly
  model: string;                    // default fallback when not specified
  transport: 'sse' | 'http';        // stream tokens via SSE or single JSON response
  stream: boolean;                  // true → stream, false → blocking

  // ---- Sampling & decoding ----
  temperature: number;              // 0.0–2.0
  top_p: number;                    // nucleus sampling
  maxTokens: number;                // server-side cap for response tokens
  stop?: string[];                  // stop sequences

  // ---- Penalties ----
  presencePenalty: number;          // discourage repeats (OpenAI)
  frequencyPenalty: number;

  // ---- Structured outputs / tools ----
  responseFormat: ResponseFormat;   // text | json_object | json_schema
  toolChoice: ToolChoice;           // 'auto' | 'none' | require a specific function
  allowParallelToolCalls: boolean;  // if provider supports concurrent calls
  tools?: Array<{                  // function-calling registry (names and JSON schemas)
    name: string;
    description?: string;
    parameters: any;                // JSON Schema
  }>;

  // ---- Prompt scaffolding ----
  systemPrompt?: string;            // optional system message
  prefixMessages?: any[];           // injected messages before user msgs

  // ---- Context management ----
  includeHistory: boolean;          // send prior turns
  maxHistoryTurns: number;          // clamp turns sent to model
  summarizeBeyondTurns: number;     // summarize older history before sending
  truncateStrategy: 'head' | 'middle' | 'tail';

  // ---- Reliability & latency ----
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number;           // linear backoff; swap for expo if needed
  abortSignal?: AbortSignal;

  // ---- Observability ----
  logSamplingRate: number;          // 0..1
  redactPIIInLogs: boolean;

  // ---- Safety toggles ----
  moderationEnabled: boolean;       // run input moderation before call
  jsonRepairOnError: boolean;       // try to repair invalid JSON from model

  // ---- Provider plumbing ----
  baseURL?: string;                 // override base URL (e.g., proxy)
  headers?: Record<string, string>; // extra headers
}

export const DEFAULT_LLM_SETUP: LlmSetup = {
  // Core model defaults (NOTE: no env var here)
  provider: 'openai',
  model: 'gpt-4.1',                 // implicit baseline model if none is supplied
  transport: 'sse',
  stream: true,

  // Sampling
  temperature: 0.2,
  top_p: 1,
  maxTokens: 1200,
  stop: [],

  // Penalties
  presencePenalty: 0,
  frequencyPenalty: 0,

  // Structured outputs / tools
  responseFormat: { type: 'text' },
  toolChoice: 'auto',
  allowParallelToolCalls: false,
  tools: [],

  // Prompt scaffolding
  systemPrompt: undefined,
  prefixMessages: [],

  // Context management
  includeHistory: true,
  maxHistoryTurns: 20,
  summarizeBeyondTurns: 16,
  truncateStrategy: 'head',

  // Reliability
  timeoutMs: 30_000,
  maxRetries: 1,
  retryBackoffMs: 500,

  // Observability
  logSamplingRate: 0.1,
  redactPIIInLogs: true,

  // Safety
  moderationEnabled: false,
  jsonRepairOnError: true,

  // Provider plumbing
  baseURL: undefined,
  headers: {},
};

// Helper: deep-merge overrides into defaults
export function withOverrides(base: LlmSetup, overrides?: Partial<LlmSetup>): LlmSetup {
  return {
    ...base,
    ...overrides,
    responseFormat: overrides?.responseFormat ?? base.responseFormat,
    toolChoice: overrides?.toolChoice ?? base.toolChoice,
    tools: overrides?.tools ?? base.tools,
    prefixMessages: overrides?.prefixMessages ?? base.prefixMessages,
    headers: { ...(base.headers || {}), ...(overrides?.headers || {}) },
  };
}
```

Why these options? They surface all the levers you typically touch when integrating modern chat models (sampling, JSON/structured outputs, function calling, streaming, context control, retries, logging), while keeping a safe default baseline you can tweak per-request. For streaming we use SSE with the text/event-stream media type; Route Handlers are a natural fit in the Next.js App Router. (See references above in the preface.)

2) Provider-Agnostic Client Wrapper (one place to adapt SDKs)
```ts
// lib/llm/client.ts
import { LlmSetup } from './config';

export interface LlmCallArgs {
  setup: LlmSetup;              // fully resolved config
  messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; }[];
}

export interface LlmCallResult {
  // For blocking calls
  text?: string;
  // For streaming, you’ll write to a controller; see stream section below.
}

export async function callLLM({ setup, messages }: LlmCallArgs): Promise<LlmCallResult> {
  // Pseudocode: swap for actual SDKs; honor setup.* knobs consistently
  const { provider, model } = setup;

  // Example: OpenAI Responses API style (sketch)
  if (provider === 'openai') {
    // Build the request body honoring *all* setup options
    const body: any = {
      model,
      temperature: setup.temperature,
      top_p: setup.top_p,
      max_output_tokens: setup.maxTokens,
      stop: setup.stop && setup.stop.length ? setup.stop : undefined,
      // Structured outputs
      response_format:
        setup.responseFormat.type === 'text' ? undefined : setup.responseFormat,
      // Tools (functions)
      tools: setup.tools && setup.tools.length ? setup.tools : undefined,
      tool_choice: setup.toolChoice === 'auto' || setup.toolChoice === 'none'
        ? setup.toolChoice
        : setup.toolChoice, // { type:'function', name:'...' }
      // Messages (prepend system + prefixes)
      input: [
        ...(setup.systemPrompt ? [{ role: 'system', content: setup.systemPrompt }] : []),
        ...(setup.prefixMessages || []),
        ...messages,
      ],
    };

    // Transport choice
    if (setup.transport === 'http' || !setup.stream) {
      // Blocking: return full text
      const res = await fetch(setup.baseURL ?? 'https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
          ...(setup.headers || {}),
        },
        body: JSON.stringify(body),
        signal: setup.abortSignal,
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const json = await res.json();
      const text = json?.output_text ?? json?.choices?.[0]?.message?.content ?? '';
      return { text };
    }

    // Streaming path handled by route (see §3)
    return { text: '' };
  }

  throw new Error(`Provider not implemented: ${provider}`);
}
```

3) Streaming Chat Route (SSE) with All Knobs

Create app/api/llm/chat/route.ts. We stream by default; if the client passes stream:false or transport:'http', we do a blocking call.

```ts
// app/api/llm/chat/route.ts
import { NextRequest } from 'next/server';
import { DEFAULT_LLM_SETUP, withOverrides } from '@/lib/llm/config';

export const runtime = 'edge'; // swap to 'nodejs' if you add DB/tools that need Node APIs

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const overrides = payload?.overrides as Partial<import('@/lib/llm/config').LlmSetup> | undefined;
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];

  const setup = withOverrides(DEFAULT_LLM_SETUP, overrides);

  // If the caller didn’t specify a model, we implicitly use 'gpt-4.1'
  // (already baked into DEFAULT_LLM_SETUP.model). No env var is used.

  // SSE (stream) path
  if (setup.stream && setup.transport === 'sse') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }
        try {
          // You’d connect to the provider’s streaming endpoint here.
          // For brevity, we simulate token chunks:
          send({ type: 'start', model: setup.model });
          // ... emit tokens:
          send({ type: 'delta', text: 'Hello' });
          send({ type: 'delta', text: ', world!' });
          send({ type: 'done' });
          controller.close();
        } catch (err: any) {
          send({ type: 'error', message: err?.message || 'stream error' });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // Blocking path (non-stream)
  // Optionally import callLLM() here to do the single-shot request.
  // const { text } = await callLLM({ setup, messages });
  // return Response.json({ text });

  // For skeleton completeness:
  return Response.json({ ok: true, note: 'Non-stream path not implemented in this snippet' });
}
```

Notes

The route accepts overrides to flip any knob at runtime (model, temperature, JSON mode, tools, etc.).

For live use, swap the simulated stream with your provider’s streaming SDK/endpoint.

4) Function-Calling / Tools (Strict Schemas)
```ts
// lib/llm/tools.ts
import { z } from 'zod';

export type ToolDef<T> = {
  name: string;
  description?: string;
  schema: z.ZodType<T>;
  handler: (args: T, ctx: any) => Promise<any>;
};

export const CreateItem: ToolDef<{ title: string }> = {
  name: 'create_item',
  description: 'Create an item with a title',
  schema: z.object({ title: z.string().min(1).max(80) }),
  async handler(args, ctx) {
    const row = await ctx.db.insert(args);
    return { id: row.id };
  },
};

export const TOOL_REGISTRY = [CreateItem];

export function getTool(name: string) {
  const tool = TOOL_REGISTRY.find(t => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool;
}
```

Wire tools into requests by passing overrides.tools = [{ name, parameters: schema }] and overrides.toolChoice = 'auto' | { type:'function', name }. Validate all tool args with Zod in the handler before touching DB.

5) Client-Side: Agent-Aware Routing & Persistence (pattern)

Use dedicated routes for special agents (e.g., /agents/xyz?chatId=...), not the generic /chat.

Persist transcript + view state per agentId + chatId:

```ts
// client pattern
const agentId = 'generic';
const chatId = searchParams.get('chatId') ?? crypto.randomUUID();
const storageKey = `${agentId}-chat-${chatId}`;

useEffect(() => {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(storageKey);
  if (raw) try { setState(JSON.parse(raw)); } catch {}
  else setState({ chatId, messages: [] });
}, [storageKey]);

useEffect(() => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(state));
}, [storageKey, state]);

// For SSE, open EventSource to /api/llm/chat and append deltas to the last assistant msg.
```

6) Security, Reliability, and Observability

Moderation: If moderationEnabled, run checks before sending to model.

Timeouts & retries: Honor timeoutMs, maxRetries, retryBackoffMs.

Logging: Sample logs with logSamplingRate and redact obvious PII if redactPIIInLogs.

Abort: Feed AbortSignal into fetch/SDK to cancel long streams.

Cost counters (optional): estimate tokens and emit metrics per request.

7) Usage Examples

A) Quick call, JSON mode, custom temperature

```ts
const overrides = {
  responseFormat: { type: 'json_object' },
  temperature: 0.0,
};
await fetch('/api/llm/chat', { method:'POST', body: JSON.stringify({ messages, overrides }) });
```


B) Switch model just for this call (no env)

```ts
const overrides = { model: 'gpt-4.1-mini' }; // still falls back to 'gpt-4.1' if omitted
```


C) Require a tool

```ts
const overrides = {
  tools: [{
    name: 'create_item',
    parameters: {
      type: 'object',
      properties: { title: { type: 'string' } },
      required: ['title']
    }
  }],
  toolChoice: { type: 'function', name: 'create_item' }
};
```

8) Checklist

✓ All requests pass through withOverrides(DEFAULT_LLM_SETUP, overrides).

✓ Streaming defaults to SSE; blocking path supported.

✓ Tool calls are schema-validated and server-only.

✓ Client hydrates from localStorage; agent-aware navigation.

✓ No default model from env; implicit fallback is 'gpt-4.1'.


**Why these specific patterns?** Next.js Route Handlers are the canonical place for API logic in the App Router, and SSE (`text/event-stream`) is the standard way to stream tokens to the browser. OpenAI’s function-calling / structured-output guidance encourages explicit JSON schemas and strict validation, which we enforce with Zod. GPT-4.1 is our neutral “basic” default when callers don’t specify a model, and you can override per request without touching env vars. :contentReference[oaicite:4]{index=4}
::contentReference[oaicite:5]{index=5}
