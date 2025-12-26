import { getProducts } from '@/actions/products'
import { OrderBuilder } from '@/components/waiter/order-builder'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function WaiterPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const products = await getProducts(true)

    // Serialize products to convert Decimal to number for Client Components
    const serializedProducts = products.map(product => {
        let stock = product.stock

        // Calculate effective stock for combos
        if (product.isCombo && product.comboItems && product.comboItems.length > 0) {
            const maxPossible = product.comboItems.map((item: any) => {
                const componentStock = item.product.stock
                return Math.floor(componentStock / item.quantity)
            })
            stock = Math.min(...maxPossible)
        }

        return {
            ...product,
            stock, // Override stock with calculated value
            price: Number(product.price),
        }
    })

    return <OrderBuilder products={serializedProducts} userId={session.user.id} />
}
