import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const protectedRoutes = ["/", "/dashboard"]
  const authRoutes = ["/auth/signin", "/auth/request-access"]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Get the auth token from cookies
  const token = request.cookies.get("auth-token")

  // If accessing a protected route without authentication
  if (isProtectedRoute && !token) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If accessing auth routes while already authenticated, redirect to dashboard
  if (isAuthRoute && token) {
    try {
      // Verify token is valid
      const sessionData = JSON.parse(Buffer.from(token.value, "base64").toString())

      // Check if token is not expired
      const tokenAge = Date.now() - sessionData.timestamp
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days

      if (tokenAge <= maxAge) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch (error) {
      // Invalid token, allow access to auth routes
      console.error("Invalid token in middleware:", error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
