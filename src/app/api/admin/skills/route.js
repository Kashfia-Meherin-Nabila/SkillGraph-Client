
import { proxyExpressApi } from "@/lib/server/express-api";

export async function GET() {
  return proxyExpressApi("/admin/skills", {}, true);
}

export async function POST(request) {
  const body = await request.text();

  return proxyExpressApi(
    "/admin/skills",
    {
      method: "POST",
      body,
    },
    true
  );
}
