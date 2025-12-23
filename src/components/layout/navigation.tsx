'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    LogOut,
    ClipboardList,
    CalendarRange
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventario', href: '/inventory', icon: Package },
    { name: 'Ventas', href: '/sales', icon: ShoppingCart },
    { name: 'Historial', href: '/sales/history', icon: CalendarRange },
]

const waiterNavigation = [
    { name: 'Tomar Pedido', href: '/waiter', icon: Users },
    { name: 'Mis Pedidos', href: '/waiter/orders', icon: ClipboardList },
]

export function Navigation() {
    const pathname = usePathname()
    const { data: session } = useSession()

    // No mostrar navegación en la página de login
    if (pathname === '/login') {
        return null
    }

    const isAdmin = session?.user?.role === 'ADMIN'
    const navigation = isAdmin ? adminNavigation : waiterNavigation

    async function handleLogout() {
        await signOut({ callbackUrl: '/login' })
    }

    return (
        <>
            {/* Top Navigation (Desktop & Mobile Header) */}
            <nav className="bg-slate-900 text-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link href={isAdmin ? "/dashboard" : "/waiter"} className="text-xl font-bold">
                                ERP System
                            </Link>

                            {/* Desktop Menu */}
                            <div className="hidden md:flex gap-2">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
                                                isActive
                                                    ? 'bg-slate-700 text-white'
                                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            )}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {session?.user && (
                                <>
                                    <div className="text-sm">
                                        <p className="font-semibold hidden md:block">{session.user.name}</p>
                                        <p className="text-slate-400 text-xs hidden md:block">
                                            {isAdmin ? 'Administrador' : 'Mesero'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="text-slate-300 hover:text-white hover:bg-slate-800"
                                    >
                                        <LogOut className="w-4 h-4 md:mr-2" />
                                        <span className="hidden md:inline">Salir</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 z-50 flex justify-around items-center safe-area-bottom">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-1 p-2 rounded-lg min-w-[64px]',
                                isActive
                                    ? 'text-blue-400 bg-slate-800'
                                    : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </div>

            {/* Espaciador para no tapar contenido en móvil */}
            <div className="h-16 md:hidden" />
        </>
    )
}
