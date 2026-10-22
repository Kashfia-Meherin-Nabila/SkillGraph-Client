
import { proxyExpressApi } from "@/lib/server/express-api";

export async function PATCH(request, { params }) {
  const { moduleId } = await params;

  if (!moduleId) {
    return Response.json(
      { success: false, message: "Module ID is required." },
      { status: 400 }
    );
  }

  const body = await request.text();

  return proxyExpressApi(
    `/mentor/modules/${encodeURIComponent(moduleId)}/status`,
    {
      method: "PATCH",
      body,
    },
    true
  );
}
