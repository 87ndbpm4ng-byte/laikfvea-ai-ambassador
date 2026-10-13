import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { submitManualRequest, ManualRequestError } from "@/lib/manual-requests/service";

const originalFetch = globalThis.fetch;
const originalEnv = {
  id: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
};

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries({
    GOOGLE_SHEETS_SPREADSHEET_ID: originalEnv.id,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: originalEnv.email,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: originalEnv.key,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function configureMockSheets(failAppend = false) {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID = "spreadsheet-id";
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "manuals@example.iam.gserviceaccount.com";
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = privateKey;
  const requests: Request[] = [];
  globalThis.fetch = async (input, init) => {
    requests.push(new Request(input, init));
    if (String(input).includes("oauth2.googleapis.com")) {
      return Response.json({ access_token: "test-token" });
    }
    return failAppend
      ? Response.json({ error: { code: 500 } }, { status: 500 })
      : Response.json({ updates: { updatedRows: 1 } });
  };
  return requests;
}

test("approved products map to canonical manual rows and duplicate keys are idempotent", async () => {
  const requests = configureMockSheets();
  const input = { email: "visitor@example.com", consent: true, productId: "advanced", language: "en" as const, idempotencyKey: "one" };
  const first = await submitManualRequest(input);
  const second = await submitManualRequest(input);
  assert.equal(first.requestId, second.requestId);
  assert.equal(requests.filter((request) => request.url.includes("sheets.googleapis.com")).length, 1);
  const append = requests.find((request) => request.url.includes("sheets.googleapis.com"));
  const body = (await append?.json()) as { values: string[][] };
  assert.equal(body.values[0][3], "Hydrogen Water Bottle PRO");
  assert.equal(body.values[0][4], "advanced");
  assert.equal(body.values[0][5], "pro-user-manual.pdf");
  assert.equal(body.values[0][7], "Pending");
  assert.equal(body.values[0][8], "");
  assert.equal(body.values[0][9], "");
});

test("invalid email, missing consent and unapproved products are rejected", async () => {
  configureMockSheets();
  await assert.rejects(
    submitManualRequest({ email: "not-an-email", consent: true, productId: "everyday", language: "en" }),
    (error: unknown) => error instanceof ManualRequestError && error.code === "INVALID_EMAIL",
  );
  await assert.rejects(
    submitManualRequest({ email: "visitor@example.com", consent: false, productId: "everyday", language: "en" }),
    (error: unknown) => error instanceof ManualRequestError && error.code === "CONSENT_REQUIRED",
  );
  await assert.rejects(
    submitManualRequest({ email: "visitor@example.com", consent: true, productId: "face-body-generator", language: "en" }),
    (error: unknown) => error instanceof ManualRequestError && error.code === "MANUAL_NOT_APPROVED",
  );
});

test("missing Google configuration fails without a false success", async () => {
  delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  await assert.rejects(
    submitManualRequest({ email: "visitor@example.com", consent: true, productId: "water-ionizer", language: "fr" }),
    (error: unknown) => error instanceof ManualRequestError && error.code === "MANUAL_REQUESTS_NOT_CONFIGURED" && error.status === 503,
  );
});

test("a Sheets failure never returns a successful record", async () => {
  configureMockSheets(true);
  await assert.rejects(
    submitManualRequest({ email: "visitor-failure@example.com", consent: true, productId: "water-ionizer", language: "en" }),
    (error: unknown) => error instanceof ManualRequestError && error.code === "SHEETS_APPEND_FAILED",
  );
});
