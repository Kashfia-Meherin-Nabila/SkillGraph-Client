
import { proxyExpressApi } from "@/lib/server/express-api";

export async function GET() {
  return proxyExpressApi("/mentor/modules");
}
