import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  generateConversationResponse,
  serviceUnavailableResponse,
} from "@/lib/conversation/response-engine";
import { placeholderResponses } from "@/lib/data/placeholder-responses";
import { guides } from "@/lib/data/guides";

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

const baseRequest = {
  content: "How do I charge the Advanced Bottle?",
  guide: guides.daniel,
  history: [],
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
});

test("successful free-text request returns the server response", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: true,
        response: "Use the supplied cable and adapter.",
        sessionId: "session-1",
        requestId: "request-1",
      }),
      { status: 200 },
    );

  const result = await generateConversationResponse(baseRequest);

  assert.equal(result.content, "Use the supplied cable and adapter.");
  assert.equal(result.sessionId, "session-1");
});

test("failed free-text request never substitutes a local prototype answer", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        response: "",
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "The conversation service is temporarily unavailable.",
          requestId: "request-2",
        },
      }),
      { status: 503 },
    );

  const result = await generateConversationResponse({
    ...baseRequest,
    content: "Compare the available products",
  });

  assert.equal(result.content, serviceUnavailableResponse);
  assert.notEqual(result.content, placeholderResponses["product-comparison"]);
});

test("missing API key produces a safe service-unavailable result", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        response: "",
        error: {
          code: "MISSING_API_KEY",
          message: "The conversation service is temporarily unavailable.",
          requestId: "request-3",
        },
      }),
      { status: 503 },
    );

  const result = await generateConversationResponse(baseRequest);

  assert.equal(result.content, serviceUnavailableResponse);
  assert.doesNotMatch(result.content, /api|key|openai|retrieval|vercel/i);
});

test("request timeout produces the same safe visitor response", async () => {
  globalThis.fetch = async () => {
    throw new DOMException("The operation timed out.", "TimeoutError");
  };

  const result = await generateConversationResponse(baseRequest);

  assert.equal(result.content, serviceUnavailableResponse);
  assert.doesNotMatch(result.content, /timeout|route|server/i);
});

test("suggested-question demo fallback requires explicit opt-in", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Network unavailable");
  };

  const withoutDemoMode = await generateConversationResponse({
    ...baseRequest,
    content: "Compare the available products",
    questionId: "product-comparison",
  });
  const withDemoMode = await generateConversationResponse({
    ...baseRequest,
    content: "Compare the available products",
    questionId: "product-comparison",
    demoFallback: "suggested-question",
  });

  assert.equal(withoutDemoMode.content, serviceUnavailableResponse);
  assert.equal(
    withDemoMode.content,
    placeholderResponses["product-comparison"],
  );
});

test("invalid server content is not exposed to visitors", async () => {
  globalThis.fetch = async () =>
    new Response("<html>Internal route failure and secret details</html>", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });

  const result = await generateConversationResponse(baseRequest);

  assert.equal(result.content, serviceUnavailableResponse);
  assert.doesNotMatch(result.content, /internal|secret|html/i);
});

test("development diagnostics retain safe failure details", async () => {
  const logs: unknown[][] = [];
  console.error = (...values: unknown[]) => {
    logs.push(values);
  };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        response: "",
        error: {
          code: "REQUEST_TIMEOUT",
          message: "The conversation service is temporarily unavailable.",
          requestId: "request-diagnostic",
        },
      }),
      { status: 503 },
    );

  await generateConversationResponse(baseRequest);

  assert.equal(logs.length, 1);
  assert.equal(logs[0][0], "[conversation-client] Request failed");
  const diagnostics = logs[0][1] as Record<string, unknown>;
  assert.equal(diagnostics.kind, "http");
  assert.equal(diagnostics.status, 503);
  assert.equal(diagnostics.apiErrorCode, "REQUEST_TIMEOUT");
  assert.equal(diagnostics.requestId, "request-diagnostic");
});
