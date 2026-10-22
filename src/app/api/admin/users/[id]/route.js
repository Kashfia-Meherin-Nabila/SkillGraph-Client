import { proxyExpressApi } from "@/lib/server/express-api";

export async function DELETE(request, { params }) {
  const { id } = await params;

  if (!id) {
    return Response.json(
      { success: false, message: "User ID is required." },
      { status: 400 }
    );
  }

  return proxyExpressApi(
    `/admin/users/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    true
  );
}