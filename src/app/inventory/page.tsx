import { getProducts } from '@/actions/products'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/inventory/product-form'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function InventoryPage() {
    const products = await getProducts()
    const categories = await prisma.category.findMany()

    // Serialize products to convert Decimal to number for Client Components
    const serializedProducts = products.map(product => ({
        ...product,
        price: Number(product.price),
    }))

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Inventario</h1>
                <ProductForm categories={categories} productsList={serializedProducts} />
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {serializedProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category.name}</TableCell>
                                <TableCell>${product.price.toFixed(2)}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell>
                                    {!product.isCombo && product.stock <= product.minStock ? (
                                        <Badge variant="destructive">Bajo Stock</Badge>
                                    ) : (
                                        <Badge variant="outline">OK</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ProductForm
                                        product={product}
                                        categories={categories}
                                        productsList={serializedProducts}
                                        trigger={<Button variant="ghost" size="sm">Editar</Button>}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
