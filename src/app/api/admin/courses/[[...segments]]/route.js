
import { NextResponse } from "next/server";
import { getUserToken } from "@/lib/core/session";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api";

async function proxyCourses(request, context) {
  try {
    const token = await getUserToken();

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const { segments } = await context.params;
    const path = segments?.length
      ? `/courses/${segments.map(encodeURIComponent).join("/")}`
      : "/courses";

    const method = request.method;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const options = {
      method,
      headers,
      cache: "no-store",
    };

    if (method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      options.body = await request.text();
    }

    const response = await fetch(`${API_BASE}${path}`, options);
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Course API proxy failed:", error);

    return NextResponse.json(
      { message: "Unable to contact the course server" },
      { status: 502 },
    );
  }
}

export async function GET(request, context) {
  return proxyCourses(request, context);
}

export async function POST(request, context) {
  return proxyCourses(request, context);
}

export async function PUT(request, context) {
  return proxyCourses(request, context);
}

export async function DELETE(request, context) {
  return proxyCourses(request, context);
}
