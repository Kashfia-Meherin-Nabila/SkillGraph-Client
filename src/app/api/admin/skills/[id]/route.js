
import { proxyExpressApi } from "@/lib/server/express-api";

export async function DELETE(request, { params }) {
  const { id } = await params;

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return Response.json(
      { success: false, message: "Invalid skill ID." },
      { status: 400 }
    );
  }

  return proxyExpressApi(`/admin/skills/${id}`, {
    method: "DELETE",
  }, true);
}
