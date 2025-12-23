'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper to serialize Decimal/Date types
function serializeProduct(product: any) {
    const serialized = {
        ...product,
        price: Number(product.price),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    }

    if (product.comboItems) {
        serialized.comboItems = product.comboItems.map((item: any) => ({
            ...item,
            product: {
                ...item.product,
                price: Number(item.product.price)
            }
        }))
    }

    return serialized
}

export async function getProducts(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {}
    const products = await prisma.product.findMany({
        where,
        include: {
            category: true,
            comboItems: {
                include: {
                    product: true
                }
            }
        },
        orderBy: { name: 'asc' },
    })

    return products.map(serializeProduct)
}

export async function createProduct(data: {
    name: string
    price: number
    stock: number
    categoryId: string
    description?: string
    isActive?: boolean
    isCombo?: boolean
    comboItems?: { productId: string; quantity: number }[]
}) {
    const { comboItems, ...productData } = data

    // Si es combo, el stock inicial es 0 (se calcula dinámicamente)
    // o podríamos calcularlo basado en los items, pero mejor dejarlo en 0 y calcular al leer
    const stockToSave = productData.isCombo ? 0 : productData.stock

    const product = await prisma.product.create({
        data: {
            ...productData,
            stock: stockToSave,
            minStock: 5,
            comboItems: productData.isCombo && comboItems ? {
                create: comboItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            } : undefined
        },
        include: {
            comboItems: {
                include: { product: true }
            }
        }
    })

    revalidatePath('/inventory')
    return serializeProduct(product)
}

export async function updateProduct(id: string, data: Partial<{
    name: string
    price: number
    stock: number
    categoryId: string
    description: string
    isActive: boolean
    isCombo: boolean
    comboItems: { productId: string; quantity: number }[]
}>) {
    const { comboItems, ...productData } = data

    // Lógica para actualizar items del combo
    if (productData.isCombo && comboItems) {
        // Usamos transaccion implicitamente al actualizar
        await prisma.comboItem.deleteMany({
            where: { comboId: id }
        })

        await prisma.comboItem.createMany({
            data: comboItems.map(item => ({
                comboId: id,
                productId: item.productId,
                quantity: item.quantity
            }))
        })
    }

    const product = await prisma.product.update({
        where: { id },
        data: {
            ...productData,
            // Si es combo, ignoramos el stock que viene del formulario si queremos
            // o lo dejamos actualizar si el usuario lo fuerza (aunque no debería)
        },
        include: {
            comboItems: {
                include: { product: true }
            }
        }
    })

    revalidatePath('/inventory')
    return serializeProduct(product)
}

export async function deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } })
    revalidatePath('/inventory')
}
