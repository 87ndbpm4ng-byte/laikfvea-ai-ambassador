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
  code?: number;
  data?: {
    session_id?: string;
    session_token?: string;
  };
  message?: string;
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
    readonly providerCode?: number,
  ) {
    super(message);
    this.name = "LiveAvatarServiceError";
  }
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
    throw new LiveAvatarServiceError(
      "LiveAvatar returned an unreadable response.",
      response.status || 502,
    );
  }

  if (
    !response.ok ||
    !payload.data?.session_id ||
    !payload.data.session_token
  ) {
    throw new LiveAvatarServiceError(
      "LiveAvatar could not create a session.",
      response.status || 502,
      payload.code,
    );
  }

  return {
    sessionId: payload.data.session_id,
    sessionToken: payload.data.session_token,
    environment: configuration.environment,
    avatarSource: configuration.avatarSource,
  };
}
