import { createSign, randomUUID } from "node:crypto";
import { exhibitionProducts } from "@/lib/data/exhibition-products";
import { getProductManual, type ProductManualId } from "@/lib/data/product-manuals";
import type { SupportedLanguage } from "@/types/language";

export type ManualRequestInput = {
  email: string;
  consent: boolean;
  productId: string;
  language: SupportedLanguage;
  idempotencyKey?: string;
};

export type ManualRequestRecord = {
  requestId: string;
  requestedAt: string;
  email: string;
  productName: string;
  productId: ProductManualId;
  manualFilename: string;
  language: SupportedLanguage;
};

const supportedLanguages = new Set<SupportedLanguage>(["en", "ru", "zh", "yue", "fr"]);
const recentRequests = new Map<string, { expiresAt: number; record: ManualRequestRecord }>();
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const requestWindowMs = 10 * 60 * 1000;
const requestLimit = 5;

export class ManualRequestError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

function cleanCell(value: string) {
  const trimmed = value.trim().slice(0, 500);
  return /^[=+\-@]/.test(trimmed) ? `'${trimmed}` : trimmed;
}

function getConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new ManualRequestError("MANUAL_REQUESTS_NOT_CONFIGURED", "Manual requests are not configured.", 503);
  }
  return { spreadsheetId, clientEmail, privateKey };
}

function base64Url(value: string | Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!response.ok) throw new ManualRequestError("GOOGLE_AUTH_FAILED", "Manual request service is unavailable.", 503);
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new ManualRequestError("GOOGLE_AUTH_FAILED", "Manual request service is unavailable.", 503);
  return body.access_token;
}

async function appendRow(record: ManualRequestRecord) {
  const { spreadsheetId, clientEmail, privateKey } = getConfig();
  const token = await getAccessToken(clientEmail, privateKey);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/Requests!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[
        cleanCell(record.requestId), record.requestedAt, cleanCell(record.email),
        cleanCell(record.productName), cleanCell(record.productId), cleanCell(record.manualFilename),
        cleanCell(record.language), "Pending", "", "",
      ]] }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new ManualRequestError("SHEETS_APPEND_FAILED", "Manual request could not be saved.", 503);
}

export async function submitManualRequest(input: ManualRequestInput) {
  if (!emailPattern.test(input.email) || input.email.length > 254) {
    throw new ManualRequestError("INVALID_EMAIL", "Enter a valid email address.");
  }
  if (input.consent !== true) throw new ManualRequestError("CONSENT_REQUIRED", "Consent is required.");
  if (!supportedLanguages.has(input.language)) throw new ManualRequestError("INVALID_LANGUAGE", "The request is invalid.");
  const manual = getProductManual(input.productId);
  const product = exhibitionProducts[input.productId as keyof typeof exhibitionProducts];
  if (!manual || !product) throw new ManualRequestError("MANUAL_NOT_APPROVED", "This manual is not available.");

  const now = Date.now();
  const normalizedEmail = input.email.trim().toLowerCase();
  const rate = rateLimits.get(normalizedEmail);
  if (rate && rate.resetAt > now && rate.count >= requestLimit) {
    throw new ManualRequestError("RATE_LIMITED", "Please try again later.", 429);
  }
  rateLimits.set(normalizedEmail, { count: rate && rate.resetAt > now ? rate.count + 1 : 1, resetAt: now + requestWindowMs });

  if (input.idempotencyKey) {
    const existing = recentRequests.get(input.idempotencyKey);
    if (existing && existing.expiresAt > now) return existing.record;
  }

  const record: ManualRequestRecord = {
    requestId: `MR-${randomUUID()}`,
    requestedAt: new Date(now).toISOString(),
    email: normalizedEmail,
    productName: product.displayNames.en,
    productId: manual.id,
    manualFilename: manual.filename ?? manual.href.split("/").pop() ?? "manual.pdf",
    language: input.language,
  };
  await appendRow(record);
  if (input.idempotencyKey) recentRequests.set(input.idempotencyKey, { expiresAt: now + requestWindowMs, record });
  return record;
}
