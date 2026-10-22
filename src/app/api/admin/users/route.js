import { proxyExpressApi } from "@/lib/server/express-api";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const query = new URLSearchParams();

  const search = searchParams.get("search");
  const role = searchParams.get("role");

  if (search) query.set("search", search);
  if (role && role !== "all") query.set("role", role);

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return proxyExpressApi(`/admin/users${suffix}`, {}, true);
}