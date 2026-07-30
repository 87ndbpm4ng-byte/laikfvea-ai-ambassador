import {
  createLiveAvatarSessionToken,
  getLiveAvatarIdleTimeoutSeconds,
  LiveAvatarConfigurationError,
  LiveAvatarServiceError,
} from "@/lib/liveavatar/session-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(code: string, message: string, status: number) {
  return Response.json(
    {
      success: false,
      error: { code, message },
    },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function GET() {
  const environment = process.env.LIVEAVATAR_ENVIRONMENT;
  const validEnvironment =
    environment === "sandbox" || environment === "production";

  return Response.json(
    {
      enabled: process.env.NEXT_PUBLIC_LIVEAVATAR_ENABLED === "true",
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
  if (process.env.NEXT_PUBLIC_LIVEAVATAR_ENABLED !== "true") {
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
      console.error("[liveavatar] Session token request failed.", {
        status: error.status,
        providerCode: error.providerCode,
      });
      return errorResponse(
        "SESSION_TOKEN_FAILED",
        "LiveAvatar could not start a session.",
        502,
      );
    }

    console.error("[liveavatar] Unexpected session failure.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse(
      "SERVICE_UNAVAILABLE",
      "LiveAvatar is temporarily unavailable.",
      503,
    );
  }
}
