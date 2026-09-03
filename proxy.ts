import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every request so Server Components
 * never read an expired token, and gates the back office: /admin/* needs a
 * signed-in staff member, else it redirects to /admin/login. The admin layout
 * re-checks (defence in depth). Next 16 calls this "proxy"; it is the former
 * middleware.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const sb = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();

  const isLogin = pathname === "/admin/login";
  if (!user && !isLogin) {
    const to = new URL("/admin/login", request.url);
    to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }
  if (user && isLogin) return NextResponse.redirect(new URL("/admin", request.url));
  if (process.env.VERCEL_ENV !== "production") response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
