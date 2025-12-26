import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const dynamic = "force-dynamic";


export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: true,
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Serializar Decimal a número
        const serializedOrders = orders.map(order => ({
            ...order,
            total: Number(order.total),
            cashReceived: order.cashReceived ? Number(order.cashReceived) : null,
            changeGiven: order.changeGiven ? Number(order.changeGiven) : null,
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

        return NextResponse.json(serializedOrders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 })
    }
}
