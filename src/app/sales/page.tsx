'use client'

import { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Pause, Play } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type Order = {
    id: string
    total: number
    status: string
    paymentMethod: string
    cashReceived?: number | null
    changeGiven?: number | null
    cashAmount?: number | null // For mixed payments
    cardAmount?: number | null // For mixed payments
    createdAt: string
    updatedAt: string
    userId: string
    user: {
        id: string
        name: string
        email: string
    }
    items: {
        id: string
        quantity: number
        price: number
        product: {
            id: string
            name: string
            price: number
        }
    }[]
}

export default function SalesPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
    const [newOrdersCount, setNewOrdersCount] = useState(0)

    const fetchOrders = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setIsRefreshing(true)

            const response = await fetch('/api/orders', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                }
            })

            if (!response.ok) throw new Error('Error al obtener órdenes')

            const data: Order[] = await response.json()

            // Detectar nuevas órdenes
            if (orders.length > 0 && data.length > orders.length) {
                const newCount = data.length - orders.length
                setNewOrdersCount(newCount)

                // Limpiar notificación después de 5 segundos
                setTimeout(() => setNewOrdersCount(0), 5000)
            }

            setOrders(data)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    // Cargar órdenes inicialmente
    useEffect(() => {
        fetchOrders()
    }, [])

    // Auto-refresh cada 10 segundos
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            fetchOrders(true)
        }, 10000) // 10 segundos

        return () => clearInterval(interval)
    }, [autoRefresh, orders])

    const handleManualRefresh = () => {
        fetchOrders(true)
    }

    const toggleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh)
    }

    // Cálculos de métricas
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0)

    const cashSales = orders.reduce((sum, order) => {
        if (order.paymentMethod === 'EFECTIVO') {
            return sum + order.total
        } else if (order.paymentMethod === 'MIXTO' && order.cashAmount) {
            return sum + order.cashAmount
        }
        return sum
    }, 0)

    const cardTransferSales = orders.reduce((sum, order) => {
        if (order.paymentMethod === 'TARJETA') {
            return sum + order.total
        } else if (order.paymentMethod === 'MIXTO' && order.cardAmount) {
            return sum + order.cardAmount
        }
        return sum
    }, 0)

    const todayOrders = orders.filter(
        (order) =>
            new Date(order.createdAt).toDateString() === new Date().toDateString()
    )
    const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0)

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">Cargando ventas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Registro de Ventas</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAutoRefresh}
                            className={autoRefresh ? 'bg-green-50' : 'bg-slate-50'}
                        >
                            {autoRefresh ? (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Auto-refresh ON
                                </>
                            ) : (
                                <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Auto-refresh OFF
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Notificación de nuevos pedidos */}
                {newOrdersCount > 0 && (
                    <div className="mb-4 bg-green-50 border-2 border-green-500 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                            <p className="font-semibold text-green-800">
                                🎉 {newOrdersCount} nuevo{newOrdersCount > 1 ? 's' : ''} pedido{newOrdersCount > 1 ? 's' : ''} recibido{newOrdersCount > 1 ? 's' : ''}!
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Cards - Resumen Financiero */}
                <h2 className="text-lg font-semibold mb-3 text-slate-700">Resumen Financiero</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Venta Total</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{formatPrice(totalSales)}</p>
                        <div className="mt-2 text-xs text-slate-500">
                            {orders.length} órdenes totales
                        </div>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-green-500 shadow-sm">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                            💵 Efectivo
                        </p>
                        <p className="text-3xl font-bold text-green-700 mt-1">{formatPrice(cashSales)}</p>
                        <div className="mt-2 text-xs text-slate-500">
                            {orders.filter(o => o.paymentMethod === 'EFECTIVO').length} órdenes
                        </div>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                            💳 Tarjeta / Transf.
                        </p>
                        <p className="text-3xl font-bold text-purple-700 mt-1">{formatPrice(cardTransferSales)}</p>
                        <div className="mt-2 text-xs text-slate-500">
                            {orders.filter(o => o.paymentMethod !== 'EFECTIVO').length} órdenes
                        </div>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-orange-500 shadow-sm bg-orange-50/30">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Ventas de Hoy</p>
                        <p className="text-3xl font-bold text-orange-700 mt-1">{formatPrice(todaySales)}</p>
                        <div className="mt-2 text-xs text-slate-500">
                            {todayOrders.length} órdenes hoy
                        </div>
                    </Card>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-100">
                            <TableHead className="font-bold">Fecha</TableHead>
                            <TableHead className="font-bold">Mesero</TableHead>
                            <TableHead className="font-bold">Productos</TableHead>
                            <TableHead className="font-bold">Total</TableHead>
                            <TableHead className="font-bold">Paga con</TableHead>
                            <TableHead className="font-bold">Cambio</TableHead>
                            <TableHead className="font-bold">Medio de Pago</TableHead>
                            <TableHead className="font-bold">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order, index) => {
                            const isNew = index === 0 && newOrdersCount > 0
                            return (
                                <TableRow
                                    key={order.id}
                                    className={isNew ? 'bg-green-50 animate-fade-in' : ''}
                                >
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">
                                                {new Date(order.createdAt).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {new Date(order.createdAt).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isNew && <Badge variant="secondary" className="mr-2">🆕</Badge>}
                                        {order.user.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="text-sm">
                                                    <span className="font-semibold">{item.quantity}x</span> {item.product.name}
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-lg">
                                        {formatPrice(order.total)}
                                    </TableCell>
                                    <TableCell>
                                        {order.cashReceived ? (
                                            <span className="text-slate-600 font-medium">{formatPrice(order.cashReceived)}</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {order.changeGiven ? (
                                            <span className="text-green-600 font-bold">{formatPrice(order.changeGiven)}</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {order.paymentMethod === 'EFECTIVO' ? '💵' : '💳'} {order.paymentMethod || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                                        >
                                            {order.status === 'COMPLETED' ? '✓ Completada' : order.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {orders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No hay ventas registradas aún
                </div>
            )}
        </div>
    )
}
