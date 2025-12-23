'use server'

import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function getSalesHistory(startDate: Date, endDate: Date) {
    try {
        const from = startOfDay(startDate)
        const to = endOfDay(endDate)

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: from,
                    lte: to,
                },
                status: 'COMPLETED', // Solo ventas completadas
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // Calcular totales
        const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
        const cashSales = orders
            .filter(o => o.paymentMethod === 'EFECTIVO')
            .reduce((sum, order) => sum + Number(order.total), 0)
        const cardSales = orders
            .filter(o => o.paymentMethod !== 'EFECTIVO')
            .reduce((sum, order) => sum + Number(order.total), 0)

        // Serializar para el cliente
        const serializedOrders = orders.map(order => ({
            id: order.id,
            total: Number(order.total),
            paymentMethod: order.paymentMethod,
            cashReceived: order.cashReceived ? Number(order.cashReceived) : null,
            changeGiven: order.changeGiven ? Number(order.changeGiven) : null,
            createdAt: order.createdAt,
            waiterName: order.user.name,
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: Number(item.price),
                productName: item.product.name
            }))
        }))

        return {
            orders: serializedOrders,
            summary: {
                total: totalSales,
                cash: cashSales,
                card: cardSales,
                count: orders.length
            }
        }

    } catch (error) {
        console.error('Error fetching sales history:', error)
        throw new Error('Error al obtener el historial de ventas')
    }
}
