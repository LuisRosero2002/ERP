'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createProduct, updateProduct } from '@/actions/products'
import { Product, Category } from '@prisma/client'

const productSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    stock: z.number().int().min(0, 'El stock debe ser mayor o igual a 0'),
    categoryId: z.string().min(1, 'La categoría es requerida'),
    description: z.string().optional(),
    isActive: z.boolean(),
    isCombo: z.boolean(),
    comboItems: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1)
    })).optional()
})

type ProductFormValues = z.infer<typeof productSchema>

// Serialized product type for passing from Server to Client Components
// Agregamos isActive opcional
type SerializedProduct = Omit<Product, 'price'> & {
    price: number;
    isActive?: boolean;
    isCombo?: boolean;
    comboItems?: { productId: string; quantity: number }[]
}

interface ProductFormProps {
    product?: SerializedProduct
    categories: Category[]
    productsList?: SerializedProduct[]
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function ProductForm({ product, categories, productsList = [], trigger, onSuccess }: ProductFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Watch for conditional rendering
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: product?.name || '',
            price: product ? product.price : 0,
            stock: product?.stock || 0,
            categoryId: product?.categoryId || categories[0]?.id || '',
            description: product?.description || '',
            isActive: product?.isActive ?? true,
            isCombo: product?.isCombo ?? false,
            comboItems: product?.comboItems || []
        },
    })

    const isCombo = form.watch('isCombo')
    const currentComboItems = form.watch('comboItems') || []

    const handleAddComboItem = (productId: string) => {
        const currentItems = form.getValues('comboItems') || []
        if (currentItems.find(item => item.productId === productId)) return
        form.setValue('comboItems', [...currentItems, { productId, quantity: 1 }])
    }

    const handleRemoveComboItem = (productId: string) => {
        const currentItems = form.getValues('comboItems') || []
        form.setValue('comboItems', currentItems.filter(item => item.productId !== productId))
    }

    const handleUpdateComboItemQuantity = (productId: string, quantity: number) => {
        const currentItems = form.getValues('comboItems') || []
        form.setValue('comboItems', currentItems.map(item =>
            item.productId === productId ? { ...item, quantity } : item
        ))
    }

    async function onSubmit(data: ProductFormValues) {
        setLoading(true)
        try {
            // Validate combo items manually if schema doesn't catch it strictly enough
            if (data.isCombo && (!data.comboItems || data.comboItems.length === 0)) {
                form.setError('comboItems', { message: 'Debe agregar al menos un producto al combo' })
                setLoading(false)
                return
            }

            if (product) {
                await updateProduct(product.id, data)
            } else {
                await createProduct(data)
            }
            setOpen(false)
            form.reset()
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Nuevo Producto</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" {...form.register('name')} />
                            {form.formState.errors.name && (
                                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="col-span-2">
                            <Label htmlFor="category">Categoría</Label>
                            <select
                                id="category"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                {...form.register('categoryId')}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="price">Precio (COP)</Label>
                            <Input id="price" type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} />
                        </div>

                        {!isCombo && (
                            <div>
                                <Label htmlFor="stock">Stock Actual</Label>
                                <Input id="stock" type="number" {...form.register('stock', { valueAsNumber: true })} />
                            </div>
                        )}
                    </div>

                    {/* Combo Switch */}
                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-purple-50 border-purple-100">
                        <input
                            type="checkbox"
                            id="isCombo"
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            {...form.register('isCombo')}
                            disabled={!!product} // Disable changing type after creation if desired, or allow it
                        />
                        <div className="flex flex-col">
                            <Label htmlFor="isCombo" className="cursor-pointer font-bold text-purple-900">
                                ¿Es un Combo?
                            </Label>
                            <span className="text-xs text-purple-700">
                                Los combos se componen de otros productos y su stock es calculado automáticamente.
                            </span>
                        </div>
                    </div>

                    {/* Combo Items Selector */}
                    {isCombo && (
                        <div className="border rounded-md p-4 space-y-4 bg-slate-50">
                            <Label>Contenido del Combo</Label>

                            {/* Product Selector */}
                            <div className="flex gap-2">
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleAddComboItem(e.target.value)
                                            e.target.value = '' // Reset
                                        }
                                    }}
                                >
                                    <option value="">+ Agregar producto al combo...</option>
                                    {productsList
                                        .filter(p => !p.isCombo && p.id !== product?.id) // Don't let combos contain combos or themselves
                                        .map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Stock: {p.stock})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Selected Items List */}
                            <div className="space-y-2">
                                {currentComboItems.length === 0 && (
                                    <p className="text-sm text-slate-500 italic">No hay productos seleccionados.</p>
                                )}
                                {currentComboItems.map((item, index) => {
                                    const productDetails = productsList.find(p => p.id === item.productId)
                                    if (!productDetails) return null

                                    return (
                                        <div key={item.productId} className="flex items-center justify-between bg-white p-2 rounded border shadow-sm">
                                            <span className="text-sm font-medium flex-1">{productDetails.name}</span>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-slate-500">Cant:</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    className="w-16 h-8 text-center"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateComboItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 w-8 h-8 p-0"
                                                    onClick={() => handleRemoveComboItem(item.productId)}
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {form.formState.errors.comboItems && (
                                <p className="text-sm text-red-500">{form.formState.errors.comboItems.message}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Input id="description" {...form.register('description')} />
                    </div>

                    {/* Active Switch */}
                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            {...form.register('isActive')}
                        />
                        <Label htmlFor="isActive" className="cursor-pointer font-medium">
                            Producto Activo
                        </Label>
                        <span className="text-xs text-slate-500 ml-2">
                            (Si se desactiva, no aparecerá para los meseros)
                        </span>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
