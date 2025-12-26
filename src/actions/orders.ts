'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createOrder(data: {
    userId: string
    paymentMethod: string
    items: { productId: string; quantity: number; price: number }[]
    cashReceived?: number
    changeGiven?: number
    cashAmount?: number  // Para pagos mixtos
    cardAmount?: number  // Para pagos mixtos
}) {
    const total = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    // Transaction: Create Order + Decrement Stock
    const order = await prisma.$transaction(async (tx) => {
        // 1. Create Order
        const newOrder = await tx.order.create({
            data: {
                userId: data.userId,
                total,
                paymentMethod: data.paymentMethod,
                cashReceived: data.cashReceived,
                changeGiven: data.changeGiven,
                cashAmount: data.cashAmount,
                cardAmount: data.cardAmount,
                status: 'COMPLETED', // Auto-complete for now as per "Venta" flow
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        })

        // 2. Decrement Stock
        for (const item of data.items) {
            // Fetch product to check if it's a combo
            const product = await tx.product.findUnique({
                where: { id: item.productId },
                include: {
                    comboItems: true
                }
            })

            if (!product) continue

            // Define items to deduct stock from
            let itemsToDeduct = []

            if (product.isCombo && product.comboItems && product.comboItems.length > 0) {
                // @ts-ignore: Prisma client types
                itemsToDeduct = product.comboItems.map((comboItem: any) => ({
                    productId: comboItem.productId,
                    quantity: comboItem.quantity * item.quantity
                }))
            } else {
                // Regular product
                itemsToDeduct = [{
                    productId: item.productId,
                    quantity: item.quantity
                }]
            }

            // Process deductions
            for (const deduction of itemsToDeduct) {
                const updatedProduct = await tx.product.update({
                    where: { id: deduction.productId },
                    data: {
                        stock: { decrement: deduction.quantity }
                    }
                })

                // Auto-deactivate if stock reached 0 or less (only for regular products/components)
                if (!updatedProduct.isCombo && updatedProduct.stock <= 0) {
                    await tx.product.update({
                        where: { id: deduction.productId },
                        data: { isActive: false }
                    })
                }

                // Log movement
                await tx.stockMovement.create({
                    data: {
                        productId: deduction.productId,
                        quantity: -deduction.quantity,
                        type: 'SALE',
                        reason: `Venta #${newOrder.id} ${product.id !== deduction.productId ? '(Combo ' + product.name + ')' : ''}`
                    }
                })
            }
        }

        return newOrder
    }, {
        maxWait: 10000, // 10 seconds max wait to acquire a connection
        timeout: 15000, // 15 seconds max for the transaction to complete
    })

    revalidatePath('/sales')
    revalidatePath('/inventory') // Stock changed

    // Serialize return to avoid Decimal passing to client
    return {
        ...order,
        total: Number(order.total),
        cashReceived: order.cashReceived ? Number(order.cashReceived) : null,
        changeGiven: order.changeGiven ? Number(order.changeGiven) : null,
        cashAmount: order.cashAmount ? Number(order.cashAmount) : null,
        cardAmount: order.cardAmount ? Number(order.cardAmount) : null,
    }
}

export async function getOrders() {
    return await prisma.order.findMany({
        include: {
            user: true,
            items: {
                include: { product: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getOrdersByUser(userId: string) {
    return await prisma.order.findMany({
        where: {
            userId: userId
        },
        include: {
            items: {
                include: { product: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}
