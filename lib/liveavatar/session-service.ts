const LIVEAVATAR_API_URL = "https://api.liveavatar.com";
const LIVEAVATAR_TOKEN_PATH = "/v1/sessions/token";

export const LIVEAVATAR_SESSION_MODE = "LITE" as const;
export const LIVEAVATAR_SANDBOX_AVATAR_ID =
  "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a";
export const DEFAULT_LIVEAVATAR_IDLE_TIMEOUT_SECONDS = 120;
export const MIN_LIVEAVATAR_IDLE_TIMEOUT_SECONDS = 30;
export const MAX_LIVEAVATAR_IDLE_TIMEOUT_SECONDS = 3_600;

export type LiveAvatarEnvironment = "sandbox" | "production";
export type LiveAvatarAvatarSource = "sandbox-default" | "environment-variable";

type LiveAvatarTokenResponse = {
  code?: number | string;
  data?: {
    session_id?: string;
    session_token?: string;
  };
  detail?: unknown;
  error?: unknown;
  errors?: unknown;
  message?: string;
};

export type LiveAvatarProviderErrorDetails = {
  status: number;
  providerCode?: number | string;
  validationMessage: string;
  invalidFields: string[];
  retryable: boolean;
  environment: LiveAvatarEnvironment;
  avatarIdPresent: boolean;
  avatarIdSuffix?: string;
};

export type LiveAvatarSessionToken = {
  sessionId: string;
  sessionToken: string;
  environment: LiveAvatarEnvironment;
  avatarSource: LiveAvatarAvatarSource;
};

export type LiveAvatarConfiguration = {
  apiKey: string;
  avatarId: string;
  environment: LiveAvatarEnvironment;
  avatarSource: LiveAvatarAvatarSource;
};

export class LiveAvatarConfigurationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "API_KEY_MISSING"
      | "AVATAR_ID_MISSING"
      | "ENVIRONMENT_INVALID",
  ) {
    super(message);
    this.name = "LiveAvatarConfigurationError";
  }
}

export class LiveAvatarServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: LiveAvatarProviderErrorDetails,
  ) {
    super(message);
    this.name = "LiveAvatarServiceError";
  }

  get providerCode() {
    return this.details.providerCode;
  }

  get retryable() {
    return this.details.retryable;
  }
}

const NON_RETRYABLE_PROVIDER_STATUSES = new Set([400, 401, 403, 404, 422]);
const TRANSIENT_PROVIDER_STATUSES = new Set([429, 500, 502, 503]);
const SAFE_FALLBACK_MESSAGE = "LiveAvatar rejected the session request.";
const SENSITIVE_VALUE_PATTERN =
  /\b(?:sk-[A-Za-z0-9_-]+|Bearer\s+\S+|[A-Fa-f0-9]{8}-[A-Fa-f0-9-]{27,})\b/g;

export function isRetryableLiveAvatarStatus(status: number) {
  if (NON_RETRYABLE_PROVIDER_STATUSES.has(status)) return false;
  if (TRANSIENT_PROVIDER_STATUSES.has(status)) return true;
  return status >= 500 || status === 0;
}

function safeProviderMessage(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return SAFE_FALLBACK_MESSAGE;
  }

  return value
    .trim()
    .replace(SENSITIVE_VALUE_PATTERN, "[redacted]")
    .slice(0, 500);
}

function collectFieldNames(value: unknown, fields = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectFieldNames(entry, fields));
    return fields;
  }

  if (!value || typeof value !== "object") return fields;

  const record = value as Record<string, unknown>;
  for (const key of ["field", "param", "parameter", "property"]) {
    const field = record[key];
    if (
      typeof field === "string" &&
      /^[A-Za-z][A-Za-z0-9_.\-[\]]{0,79}$/.test(field)
    ) {
      fields.add(field);
    }
  }

  const location = record.loc ?? record.path;
  if (Array.isArray(location)) {
    const field = location
      .filter((part): part is string | number =>
        typeof part === "string" || typeof part === "number",
      )
      .map(String)
      .filter((part) => part !== "body")
      .join(".");
    if (field && /^[A-Za-z0-9_.\-[\]]{1,80}$/.test(field)) fields.add(field);
  } else if (
    typeof location === "string" &&
    /^[A-Za-z][A-Za-z0-9_.\-[\]]{0,79}$/.test(location)
  ) {
    fields.add(location);
  }

  Object.values(record).forEach((entry) => collectFieldNames(entry, fields));
  return fields;
}

function findProviderMessage(payload: LiveAvatarTokenResponse | null) {
  if (!payload) return SAFE_FALLBACK_MESSAGE;
  if (typeof payload.message === "string") return safeProviderMessage(payload.message);

  const candidates = [payload.detail, payload.error, payload.errors];
  for (const candidate of candidates) {
    if (typeof candidate === "string") return safeProviderMessage(candidate);
    if (candidate && typeof candidate === "object") {
      const record = candidate as Record<string, unknown>;
      const message = record.message ?? record.msg ?? record.detail;
      if (typeof message === "string") return safeProviderMessage(message);
      if (Array.isArray(candidate)) {
        const first = candidate.find(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            ("message" in entry || "msg" in entry),
        ) as Record<string, unknown> | undefined;
        const firstMessage = first?.message ?? first?.msg;
        if (typeof firstMessage === "string") {
          return safeProviderMessage(firstMessage);
        }
      }
    }
  }

  return SAFE_FALLBACK_MESSAGE;
}

export function createLiveAvatarProviderErrorDetails({
  status,
  payload,
  configuration,
}: {
  status: number;
  payload: LiveAvatarTokenResponse | null;
  configuration: LiveAvatarConfiguration;
}): LiveAvatarProviderErrorDetails {
  return {
    status,
    providerCode: payload?.code,
    validationMessage: findProviderMessage(payload),
    invalidFields: [...collectFieldNames(payload)].sort(),
    retryable: isRetryableLiveAvatarStatus(status),
    environment: configuration.environment,
    avatarIdPresent: Boolean(configuration.avatarId),
    avatarIdSuffix: configuration.avatarId
      ? `…${configuration.avatarId.slice(-4)}`
      : undefined,
  };
}

export function getLiveAvatarConfiguration(
  environment: Record<string, string | undefined> = process.env,
): LiveAvatarConfiguration {
  const apiKey = environment.LIVEAVATAR_API_KEY?.trim();
  const configuredEnvironment = environment.LIVEAVATAR_ENVIRONMENT?.trim();

  if (!apiKey) {
    throw new LiveAvatarConfigurationError(
      "LIVEAVATAR_API_KEY is not configured.",
      "API_KEY_MISSING",
    );
  }

  if (
    configuredEnvironment !== "sandbox" &&
    configuredEnvironment !== "production"
  ) {
    throw new LiveAvatarConfigurationError(
      "LIVEAVATAR_ENVIRONMENT must be sandbox or production.",
      "ENVIRONMENT_INVALID",
    );
  }

  if (configuredEnvironment === "sandbox") {
    return {
      apiKey,
      avatarId: LIVEAVATAR_SANDBOX_AVATAR_ID,
      environment: configuredEnvironment,
      avatarSource: "sandbox-default" as const,
    };
  }

  const avatarId = environment.LIVEAVATAR_DANIEL_AVATAR_ID?.trim();

  if (!avatarId) {
    throw new LiveAvatarConfigurationError(
      "LIVEAVATAR_DANIEL_AVATAR_ID is required in production.",
      "AVATAR_ID_MISSING",
    );
  }

  return {
    apiKey,
    avatarId,
    environment: "production",
    avatarSource: "environment-variable" as const,
  };
}

export function createLiveAvatarTokenRequest(
  avatarId: string,
  environment: LiveAvatarEnvironment,
) {
  const request: {
    mode: typeof LIVEAVATAR_SESSION_MODE;
    avatar_id: string;
    is_sandbox?: true;
  } = {
    mode: LIVEAVATAR_SESSION_MODE,
    avatar_id: avatarId,
  };

  if (environment === "sandbox") {
    request.is_sandbox = true;
  }

  return request;
}

export function getLiveAvatarIdleTimeoutSeconds(
  environment: Record<string, string | undefined> = process.env,
) {
  const configured = Number(environment.LIVEAVATAR_IDLE_TIMEOUT_SECONDS);

  if (
    !Number.isInteger(configured) ||
    configured < MIN_LIVEAVATAR_IDLE_TIMEOUT_SECONDS ||
    configured > MAX_LIVEAVATAR_IDLE_TIMEOUT_SECONDS
  ) {
    return DEFAULT_LIVEAVATAR_IDLE_TIMEOUT_SECONDS;
  }

  return configured;
}

export function isLiveAvatarEnabled(
  environment: Record<string, string | undefined> = process.env,
) {
  return environment.NEXT_PUBLIC_LIVEAVATAR_ENABLED?.trim() === "true";
}

export async function createLiveAvatarSessionToken({
  environment = process.env,
  fetchImplementation = fetch,
}: {
  environment?: Record<string, string | undefined>;
  fetchImplementation?: typeof fetch;
} = {}): Promise<LiveAvatarSessionToken> {
  const configuration = getLiveAvatarConfiguration(environment);

  const response = await fetchImplementation(
    `${LIVEAVATAR_API_URL}${LIVEAVATAR_TOKEN_PATH}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": configuration.apiKey,
      },
      body: JSON.stringify(
        createLiveAvatarTokenRequest(
          configuration.avatarId,
          configuration.environment,
        ),
      ),
      cache: "no-store",
    },
  );

  let payload: LiveAvatarTokenResponse | null = null;

  try {
    payload = (await response.json()) as LiveAvatarTokenResponse;
  } catch {
    const details = createLiveAvatarProviderErrorDetails({
      status: response.status || 502,
      payload: null,
      configuration,
    });
    throw new LiveAvatarServiceError(
      "LiveAvatar returned an unreadable response.",
      details.status,
      details,
    );
  }

  if (
    !response.ok ||
    !payload.data?.session_id ||
    !payload.data.session_token
  ) {
    const details = createLiveAvatarProviderErrorDetails({
      status: response.status || 502,
      payload,
      configuration,
    });
    throw new LiveAvatarServiceError(
      "LiveAvatar could not create a session.",
      details.status,
      details,
    );
  }

  return {
    sessionId: payload.data.session_id,
    sessionToken: payload.data.session_token,
    environment: configuration.environment,
    avatarSource: configuration.avatarSource,
  };
}
