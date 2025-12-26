import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getOrdersByUser } from "@/actions/orders"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

export default async function WaiterOrdersPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Solo meseros pueden acceder
    if (session.user.role !== "WAITER") {
        redirect("/dashboard")
    }

    const ordersRaw = await getOrdersByUser(session.user.id)

    // Serialize orders to avoid passing Decimal objects to Client Components
    const orders = ordersRaw.map(order => ({
        ...order,
        total: Number(order.total),
        cashAmount: order.cashAmount ? Number(order.cashAmount) : null,
        cardAmount: order.cardAmount ? Number(order.cardAmount) : null,
        items: order.items.map(item => ({
            ...item,
            price: Number(item.price),
            product: {
                ...item.product,
                price: Number(item.product.price)
            }
        }))
    }))

    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const todayOrders = orders.filter(
        (order) =>
            new Date(order.createdAt).toDateString() === new Date().toDateString()
    )
    const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.total), 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Mi Historial de Pedidos</h1>
                    <p className="text-slate-600">
                        Aquí puedes ver todos los pedidos que has registrado
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                        <p className="text-sm text-blue-600 font-semibold mb-1">Total de Órdenes</p>
                        <p className="text-3xl font-bold text-blue-900">{orders.length}</p>
                    </Card>
                    <Card className="p-4 border-2 border-green-200 bg-green-50">
                        <p className="text-sm text-green-600 font-semibold mb-1">Ventas Totales</p>
                        <p className="text-3xl font-bold text-green-900">{formatPrice(totalSales)}</p>
                    </Card>
                    <Card className="p-4 border-2 border-purple-200 bg-purple-50">
                        <p className="text-sm text-purple-600 font-semibold mb-1">Ventas Hoy</p>
                        <p className="text-3xl font-bold text-purple-900">{formatPrice(todaySales)}</p>
                    </Card>
                </div>

                {/* Orders Table */}
                {orders.length > 0 ? (
                    <Card className="overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-100">
                                        <TableHead className="font-bold">Fecha y Hora</TableHead>
                                        <TableHead className="font-bold">Productos</TableHead>
                                        <TableHead className="font-bold">Total</TableHead>
                                        <TableHead className="font-bold">Método de Pago</TableHead>
                                        <TableHead className="font-bold">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-slate-50">
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div className="font-semibold">
                                                        {new Date(order.createdAt).toLocaleDateString('es-ES', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {new Date(order.createdAt).toLocaleTimeString('es-ES', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="text-sm">
                                                            <span className="font-semibold">{item.quantity}x</span>{' '}
                                                            {item.product.name}
                                                            <span className="text-slate-500 ml-2">
                                                                ({formatPrice(Number(item.price))})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-lg text-green-700">
                                                {formatPrice(Number(order.total))}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-semibold">
                                                    {order.paymentMethod === 'EFECTIVO' ? '💵' : '💳'}{' '}
                                                    {order.paymentMethod}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        order.status === 'COMPLETED'
                                                            ? 'default'
                                                            : order.status === 'PENDING'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                    className="font-semibold"
                                                >
                                                    {order.status === 'COMPLETED'
                                                        ? '✓ Completada'
                                                        : order.status === 'PENDING'
                                                            ? '⏱ Pendiente'
                                                            : '✗ Cancelada'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            No hay pedidos registrados
                        </h3>
                        <p className="text-slate-500">
                            Los pedidos que realices aparecerán aquí
                        </p>
                    </Card>
                )}
            </div>
        </div>
    )
}
