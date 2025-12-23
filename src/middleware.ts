import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const { pathname } = req.nextUrl
    const isLoggedIn = !!req.auth
    const userRole = req.auth?.user?.role

    // Rutas públicas
    if (pathname === "/login") {
        if (isLoggedIn) {
            // Si ya está logueado, redirigir según rol
            if (userRole === "ADMIN") {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            } else {
                return NextResponse.redirect(new URL("/waiter", req.url))
            }
        }
        return NextResponse.next()
    }

    // Proteger todas las demás rutas
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Rutas solo para ADMIN
    const adminRoutes = ["/dashboard", "/inventory", "/sales"]
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

    if (isAdminRoute && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/waiter", req.url))
    }

    // Ruta solo para WAITER
    if (pathname.startsWith("/waiter") && userRole !== "WAITER" && userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
