import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  generateConversationResponse,
  getConversationFailureResponse,
  getServiceUnavailableResponse,
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

test("service failures use the selected visitor language", () => {
  assert.equal(getServiceUnavailableResponse("en"), serviceUnavailableResponse);
  assert.match(getServiceUnavailableResponse("ru"), /информации о продукте/);
  assert.match(getServiceUnavailableResponse("zh"), /产品信息/);
  assert.match(getServiceUnavailableResponse("yue"), /產品資料/);
  assert.match(getServiceUnavailableResponse("fr"), /informations produit/);
});

test("network and timeout recovery guidance is localized without technical details", () => {
  for (const language of ["en", "ru", "zh", "yue", "fr"] as const) {
    const network = getConversationFailureResponse("network", language);
    const timeout = getConversationFailureResponse("timeout", language);
    assert.ok(network.length > 8, language);
    assert.ok(timeout.length > 8, language);
    assert.doesNotMatch(`${network} ${timeout}`, /\bHTTP\b|\bAPI\b|OpenAI|LiveAvatar|request ID/i);
  }
  assert.match(getConversationFailureResponse("network", "en"), /Quick Question/);
  assert.match(getConversationFailureResponse("timeout", "en"), /ask your question again/i);
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

test("selected exhibition product identity is sent to the conversation route", async () => {
  let requestBody: Record<string, unknown> | null = null;
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        success: true,
        response: "I do not have approved information on that product yet.",
        sessionId: "session-product",
        requestId: "request-product",
      }),
      { status: 200 },
    );
  };

  await generateConversationResponse({
    ...baseRequest,
    content: "Tell me about the Air Purifier.",
    relatedProduct: "air-purifier",
  });

  assert.equal(requestBody?.activeProduct, "air-purifier");
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

test("request timeout produces concise retry guidance", async () => {
  globalThis.fetch = async () => {
    throw new DOMException("The operation timed out.", "TimeoutError");
  };

  const result = await generateConversationResponse(baseRequest);

  assert.equal(result.content, getConversationFailureResponse("timeout", "en"));
  assert.doesNotMatch(result.content, /timeout|route|server|provider/i);
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

  assert.equal(withoutDemoMode.content, getConversationFailureResponse("network", "en"));
  assert.equal(
    withDemoMode.content,
    placeholderResponses["product-comparison"],
  );
});

test("a visitor can retry immediately after a recoverable network failure", async () => {
  let attempt = 0;
  globalThis.fetch = async () => {
    attempt += 1;
    if (attempt === 1) throw new TypeError("Network unavailable");
    return new Response(JSON.stringify({
      success: true,
      response: "The documented cycle lasts five minutes.",
      requestId: "request-retry",
    }));
  };

  const failed = await generateConversationResponse(baseRequest);
  const retried = await generateConversationResponse(baseRequest);
  assert.equal(failed.content, getConversationFailureResponse("network", "en"));
  assert.equal(retried.content, "The documented cycle lasts five minutes.");
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
