import { NextRequest, NextResponse } from "next/server";

const USERNAME = "moriva";

function safeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export function proxy(request: NextRequest) {
  const password = process.env.SITE_ACCESS_PASSWORD;
  if (!password) return NextResponse.next();

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(":");
      const suppliedUsername = separator >= 0 ? decoded.slice(0, separator) : "";
      const suppliedPassword = separator >= 0 ? decoded.slice(separator + 1) : "";

      if (safeEqual(suppliedUsername, USERNAME) && safeEqual(suppliedPassword, password)) {
        return NextResponse.next();
      }
    } catch {
      // Invalid base64 credentials fall through to the login challenge.
    }
  }

  return new NextResponse("MORIVA Studio access requires a password.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": 'Basic realm="MORIVA Studio", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|moriva-favicon.png|moriva-brand-guide.png).*)",
  ],
};
