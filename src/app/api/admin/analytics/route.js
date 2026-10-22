import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/core/session";
import { apiFetch } from "@/lib/core/api";

export async function GET() {
     console.log("Admin analytics Route Handler called");
  try {
    const session = await getUserSession();
    console.log("Session exists:", Boolean(session?.user));

    if (!session?.user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const role = String(
      session.user.role || session.user.userType || ""
    ).toLowerCase();

    if (role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const response = await apiFetch("/admin/analytics");
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      { message: "Failed to load analytics" },
      { status: 500 }
    );
  }
}