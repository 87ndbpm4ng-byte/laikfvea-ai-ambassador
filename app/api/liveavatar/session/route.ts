import {
  createLiveAvatarSessionToken,
  getLiveAvatarIdleTimeoutSeconds,
  isLiveAvatarEnabled,
  LiveAvatarConfigurationError,
  LiveAvatarServiceError,
} from "@/lib/liveavatar/session-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VOICE_ONLY_MESSAGE =
  "The avatar session could not be started. Voice-only mode is available.";

function errorResponse(
  code: string,
  message: string,
  status: number,
  retryable = false,
) {
  return Response.json(
    {
      success: false,
      error: { code, message, retryable },
    },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function GET() {
  const environment = process.env.LIVEAVATAR_ENVIRONMENT?.trim();
  const validEnvironment =
    environment === "sandbox" || environment === "production";

  return Response.json(
    {
      enabled: isLiveAvatarEnabled(),
      environment: validEnvironment ? environment : "invalid",
      avatarSource:
        environment === "sandbox"
          ? "sandbox-default"
          : environment === "production"
            ? "environment-variable"
            : "unavailable",
      idleTimeoutSeconds: getLiveAvatarIdleTimeoutSeconds(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  if (!isLiveAvatarEnabled()) {
    return errorResponse(
      "LIVEAVATAR_DISABLED",
      "LiveAvatar is not enabled.",
      503,
    );
  }

  try {
    const session = await createLiveAvatarSessionToken();

    return Response.json(
      {
        success: true,
        sessionId: session.sessionId,
        sessionToken: session.sessionToken,
        mode: "LITE",
        environment: session.environment,
        avatarSource: session.avatarSource,
        idleTimeoutSeconds: getLiveAvatarIdleTimeoutSeconds(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof LiveAvatarConfigurationError) {
      console.error("[liveavatar] Server configuration is incomplete.", {
        name: error.name,
        code: error.code,
      });

      if (error.code === "ENVIRONMENT_INVALID") {
        return errorResponse(
          error.code,
          "The LiveAvatar environment configuration is invalid.",
          400,
        );
      }

      return errorResponse(
        "CONFIGURATION_MISSING",
        "LiveAvatar is not configured.",
        503,
      );
    }

    if (error instanceof LiveAvatarServiceError) {
      console.error(
        "[LiveAvatar] Session token request failed.",
        error.details,
      );
      return errorResponse(
        error.retryable
          ? "LIVEAVATAR_TEMPORARILY_UNAVAILABLE"
          : "LIVEAVATAR_CONFIGURATION_REJECTED",
        VOICE_ONLY_MESSAGE,
        502,
        error.retryable,
      );
    }

    console.error("[liveavatar] Unexpected session failure.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(
      "SERVICE_UNAVAILABLE",
      VOICE_ONLY_MESSAGE,
      503,
      true,
    );
  }
}
