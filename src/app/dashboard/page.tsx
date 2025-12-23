import { getOrders } from '@/actions/orders'
import { getProducts } from '@/actions/products'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ShoppingCart,
    Package,
    TrendingUp,
    AlertTriangle
} from 'lucide-react'

export default async function DashboardPage() {
    const [orders, products] = await Promise.all([
        getOrders(),
        getProducts(),
    ])

    const todayOrders = orders.filter(
        (order) =>
            new Date(order.createdAt).toDateString() === new Date().toDateString()
    )

    const todayRevenue = todayOrders.reduce(
        (sum, order) => sum + Number(order.total),
        0
    )

    const lowStockProducts = products.filter(
        // @ts-ignore
        (product) => product.stock <= product.minStock && !product.isCombo
    )

    const stats = [
        {
            title: 'Ventas Hoy',
            value: todayOrders.length,
            icon: ShoppingCart,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Ingresos Hoy',
            value: `$${todayRevenue.toFixed(2)}`,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Productos',
            value: products.length,
            icon: Package,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Stock Bajo',
            value: lowStockProducts.length,
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ]

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <Card key={stat.title} className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                    {stat.title}
                                </p>
                                <p className="text-3xl font-bold">{stat.value}</p>
                            </div>
                            <div className={`${stat.bgColor} p-3 rounded-lg`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <Card className="p-6 mb-8 border-red-200 bg-red-50">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-red-900 mb-2">
                                Alerta de Stock Bajo
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {lowStockProducts.map((product) => (
                                    <Badge key={product.id} variant="destructive">
                                        {product.name} ({product.stock} unidades)
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Recent Orders */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Últimas Ventas</h2>
                <div className="space-y-3">
                    {todayOrders.slice(0, 5).map((order) => (
                        <div
                            key={order.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                            <div>
                                <p className="font-medium">{order.user.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {order.items.length} producto(s)
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">
                                    ${Number(order.total).toFixed(2)}
                                </p>
                                <Badge variant="outline">{order.paymentMethod}</Badge>
                            </div>
                        </div>
                    ))}
                    {todayOrders.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            No hay ventas registradas hoy
                        </p>
                    )}
                </div>
            </Card>
        </div>
    )
}
