import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getUserSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session?.user ? session : null;
  } catch (error) {
    console.error("Failed to get user session:", error.message);
    return null;
  }
}

export async function getUserToken() {
  try {
    const requestHeaders = await headers();

    const result = await auth.api.getToken({
      headers: requestHeaders,
    });

    const token = result?.token;

    console.log("JWT created:", Boolean(token));

    if (token) {
      console.log("JWT length:", token.length);
    }

    return token || null;
  } catch (error) {
    console.error("JWT generation failed:", error.message);
    return null;
  }
}