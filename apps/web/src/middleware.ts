import {NextResponse} from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "rest-password"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    //Allow public paths
    if(PUBLIC_PATHS.some((p) => pathname.startsWith(p))){
        return NextResponse.next();
    }

    //check for access token in cookie ( set by auth store)
    // we check localstorage via a cookie  we set on login 
    const token = request.cookies.get("iqmd_auth_check")?.value;

    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
    ],
};
