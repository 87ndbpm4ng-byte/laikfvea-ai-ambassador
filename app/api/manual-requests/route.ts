import { ManualRequestError, submitManualRequest, type ManualRequestInput } from "@/lib/manual-requests/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxBodyBytes = 8 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > maxBodyBytes) throw new ManualRequestError("REQUEST_TOO_LARGE", "The request is invalid.");
    const body = (await request.json()) as Partial<ManualRequestInput>;
    const record = await submitManualRequest({
      email: typeof body.email === "string" ? body.email : "",
      consent: body.consent === true,
      productId: typeof body.productId === "string" ? body.productId : "",
      language: body.language as ManualRequestInput["language"],
      idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 100) : undefined,
    });
    return Response.json({ success: true, requestId: record.requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ManualRequestError) {
      return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    }
    return Response.json({ success: false, error: { code: "MANUAL_REQUEST_FAILED", message: "Manual request could not be saved." } }, { status: 503 });
  }
}
