'use client'

import { useState } from 'react'
import { getSalesHistory } from '@/actions/sales-history'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'

type HistoryData = {
    orders: {
        id: string
        total: number
        paymentMethod: string | null
        cashReceived?: number | null
        changeGiven?: number | null
        createdAt: Date
        waiterName: string
        items: {
            id: string
            quantity: number
            price: number
            productName: string
        }[]
    }[]
    summary: {
        total: number
        cash: number
        card: number
        count: number
    }
}

export default function SalesHistoryPage() {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [data, setData] = useState<HistoryData | null>(null)
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async () => {
        setLoading(true)
        try {
            // Ajustar fechas para compensar zona horaria local al crear el objeto Date
            const start = new Date(startDate + 'T00:00:00')
            const end = new Date(endDate + 'T23:59:59')

            const result = await getSalesHistory(start, end)
            setData(result)
            setHasSearched(true)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/sales">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Historial de Ventas</h1>
                        <p className="text-slate-500">Consulta y análisis de ventas pasadas</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <Card className="p-6 mb-8 bg-white shadow-sm border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="start-date" className="font-semibold text-slate-700">Desde</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="start-date"
                                type="date"
                                className="pl-10"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end-date" className="font-semibold text-slate-700">Hasta</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="end-date"
                                type="date"
                                className="pl-10"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? 'Buscando...' : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Buscar Ventas
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {data && (
                <div className="space-y-8 animate-fade-in">
                    {/* Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm bg-white">
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Venta Total</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{formatPrice(data.summary.total)}</p>
                            <p className="text-xs text-slate-400 mt-2">{data.summary.count} transacciones</p>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-green-500 shadow-sm bg-white">
                            <p className="text-sm text-green-600 font-medium uppercase tracking-wider">Efectivo</p>
                            <p className="text-3xl font-bold text-green-700 mt-1">{formatPrice(data.summary.cash)}</p>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-purple-500 shadow-sm bg-white">
                            <p className="text-sm text-purple-600 font-medium uppercase tracking-wider">Tarjeta / Otros</p>
                            <p className="text-3xl font-bold text-purple-700 mt-1">{formatPrice(data.summary.card)}</p>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-slate-400 shadow-sm bg-slate-50">
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Promedio Ticket</p>
                            <p className="text-3xl font-bold text-slate-700 mt-1">
                                {data.summary.count > 0 ? formatPrice(data.summary.total / data.summary.count) : formatPrice(0)}
                            </p>
                        </Card>
                    </div>

                    {/* Tabla */}
                    <Card className="overflow-hidden border-slate-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Detalle de Transacciones</h3>
                            <Badge variant="outline" className="bg-white">
                                {data.orders.length} resultados
                            </Badge>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white hover:bg-white">
                                    <TableHead>Fecha / Hora</TableHead>
                                    <TableHead>Mesero</TableHead>
                                    <TableHead>Detalle</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="font-bold">Paga con</TableHead>
                                    <TableHead className="font-bold">Cambio</TableHead>
                                    <TableHead className="text-center">Pago</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            No se encontraron ventas en este rango de fechas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.orders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-slate-50">
                                            <TableCell>
                                                <div className="font-medium text-slate-900">
                                                    {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: es })}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {format(new Date(order.createdAt), 'HH:mm aaa', { locale: es })}
                                                </div>
                                            </TableCell>
                                            <TableCell>{order.waiterName}</TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-600 max-w-[300px] truncate">
                                                    {order.items.map(i => `${i.quantity} ${i.productName}`).join(', ')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
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
                                            <TableCell className="text-center">
                                                <Badge variant={order.paymentMethod === 'EFECTIVO' ? 'secondary' : 'default'} className="font-normal">
                                                    {order.paymentMethod}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}
        </div>
    )
}
