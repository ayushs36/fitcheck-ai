import { NextRequest, NextResponse } from "next/server";

const REALM = "FitCheck Personal";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/personal")) {
    return NextResponse.next();
  }

  const personalPassword = process.env.FITCHECK_PERSONAL_PASSWORD;

  if (!personalPassword) {
    if (!process.env.VERCEL) {
      return NextResponse.next();
    }

    return new NextResponse("Personal app is not configured.", {
      status: 404,
    });
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const password = decoded.slice(separatorIndex + 1);

    if (password === personalPassword) {
      return NextResponse.next();
    }
  } catch {
    return unauthorized();
  }

  return unauthorized();
}

export const config = {
  matcher: ["/personal/:path*"],
};
