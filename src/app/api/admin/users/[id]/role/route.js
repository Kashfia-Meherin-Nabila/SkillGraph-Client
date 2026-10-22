import { proxyExpressApi } from "@/lib/server/express-api";

export async function PATCH(request, { params }) {
  const { id } = await params;

  if (!id) {
    return Response.json(
      { success: false, message: "User ID is required." },
      { status: 400 }
    );
  }

  const body = await request.text();

  return proxyExpressApi(
    `/admin/users/${encodeURIComponent(id)}/role`,
    {
      method: "PATCH",
      body,
    },
    true
  );
}