
import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const EXPRESS_API = process.env.EXPRESS_API_URL || "http://localhost:5000/api";

export async function proxyExpressApi(path, options = {}, requireAdmin = false) {
  try {
    const requestHeaders = await headers();

    // Verify that the request has a valid Better Auth session.
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user) {
      return Response.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    if (requireAdmin && session.user.role !== "admin") {
      return Response.json(
        { success: false, message: "Administrator access required." },
        { status: 403 }
      );
    }

    // Obtain a JWT for the Express API.
    const tokenResult = await auth.api.getToken({
      headers: requestHeaders,
    });

    const token = tokenResult?.token;

    if (!token) {
      return Response.json(
        { success: false, message: "Could not obtain an access token." },
        { status: 401 }
      );
    }

    const upstream = await fetch(`${EXPRESS_API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      cache: "no-store",
    });

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Express API proxy error:", error);

    return Response.json(
      { success: false, message: "Unable to process the API request." },
      { status: 500 }
    );
  }
}
