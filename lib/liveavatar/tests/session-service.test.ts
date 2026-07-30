import assert from "node:assert/strict";
import test from "node:test";
import {
  createLiveAvatarSessionToken,
  createLiveAvatarTokenRequest,
  getLiveAvatarConfiguration,
  LIVEAVATAR_SANDBOX_AVATAR_ID,
  LIVEAVATAR_SESSION_MODE,
  LiveAvatarConfigurationError,
  LiveAvatarServiceError,
} from "../session-service";

const API_KEY = "server-secret";

test("builds the official LITE Mode sandbox configuration", () => {
  const configuration = getLiveAvatarConfiguration({
    LIVEAVATAR_API_KEY: API_KEY,
    LIVEAVATAR_ENVIRONMENT: "sandbox",
    LIVEAVATAR_DANIEL_AVATAR_ID: "ignored-production-avatar",
  });

  assert.equal(configuration.avatarId, LIVEAVATAR_SANDBOX_AVATAR_ID);
  assert.equal(configuration.avatarSource, "sandbox-default");
  assert.deepEqual(
    createLiveAvatarTokenRequest(
      configuration.avatarId,
      configuration.environment,
    ),
    {
      mode: "LITE",
      avatar_id: LIVEAVATAR_SANDBOX_AVATAR_ID,
      is_sandbox: true,
    },
  );
  assert.equal(LIVEAVATAR_SESSION_MODE, "LITE");
});

test("builds production configuration without a sandbox override", () => {
  const configuration = getLiveAvatarConfiguration({
    LIVEAVATAR_API_KEY: API_KEY,
    LIVEAVATAR_ENVIRONMENT: "production",
    LIVEAVATAR_DANIEL_AVATAR_ID: "selected-public-avatar",
  });

  assert.equal(configuration.avatarId, "selected-public-avatar");
  assert.equal(configuration.avatarSource, "environment-variable");
  assert.deepEqual(
    createLiveAvatarTokenRequest(
      configuration.avatarId,
      configuration.environment,
    ),
    {
      mode: "LITE",
      avatar_id: "selected-public-avatar",
    },
  );
});

test("rejects an invalid environment value", () => {
  assert.throws(
    () =>
      getLiveAvatarConfiguration({
        LIVEAVATAR_API_KEY: API_KEY,
        LIVEAVATAR_ENVIRONMENT: "preview",
      }),
    (error: unknown) =>
      error instanceof LiveAvatarConfigurationError &&
      error.code === "ENVIRONMENT_INVALID",
  );
});

test("requires a production avatar ID", () => {
  assert.throws(
    () =>
      getLiveAvatarConfiguration({
        LIVEAVATAR_API_KEY: API_KEY,
        LIVEAVATAR_ENVIRONMENT: "production",
      }),
    (error: unknown) =>
      error instanceof LiveAvatarConfigurationError &&
      error.code === "AVATAR_ID_MISSING",
  );
});

test("requires the server-side API key", () => {
  assert.throws(
    () =>
      getLiveAvatarConfiguration({
        LIVEAVATAR_ENVIRONMENT: "sandbox",
      }),
    (error: unknown) =>
      error instanceof LiveAvatarConfigurationError &&
      error.code === "API_KEY_MISSING",
  );
});

test("sends the API key only in the server request header", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;

  const fetchImplementation: typeof fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        data: {
          session_id: "session-test",
          session_token: "short-lived-token",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const result = await createLiveAvatarSessionToken({
    environment: {
      LIVEAVATAR_API_KEY: API_KEY,
      LIVEAVATAR_ENVIRONMENT: "sandbox",
    },
    fetchImplementation,
  });

  assert.equal(
    requestUrl,
    "https://api.liveavatar.com/v1/sessions/token",
  );
  assert.equal(
    (requestInit?.headers as Record<string, string>)["X-API-KEY"],
    API_KEY,
  );
  assert.doesNotMatch(String(requestInit?.body), /server-secret/);
  assert.deepEqual(result, {
    sessionId: "session-test",
    sessionToken: "short-lived-token",
    environment: "sandbox",
    avatarSource: "sandbox-default",
  });
});

test("fails safely when the provider rejects token creation", async () => {
  await assert.rejects(
    createLiveAvatarSessionToken({
      environment: {
        LIVEAVATAR_API_KEY: API_KEY,
        LIVEAVATAR_ENVIRONMENT: "sandbox",
      },
      fetchImplementation: async () =>
        new Response(
          JSON.stringify({
            code: 4001,
            message: "Provider detail that must remain server-side",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        ),
    }),
    (error: unknown) =>
      error instanceof LiveAvatarServiceError &&
      error.status === 400 &&
      error.providerCode === 4001,
  );
});
