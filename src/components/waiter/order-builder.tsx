'use client'

import { useState } from 'react'
import { Product } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createOrder } from '@/actions/orders'
import { MinusCircle, PlusCircle, ShoppingCart, Search, Banknote, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

// Serialized product type for passing from Server to Client Components
type SerializedProduct = Omit<Product, 'price'> & { price: number; isActive?: boolean }

interface OrderItem {
    product: SerializedProduct
    quantity: number
}

interface OrderBuilderProps {
    products: SerializedProduct[]
    userId: string
}

export function OrderBuilder({ products, userId }: OrderBuilderProps) {
    const [cart, setCart] = useState<OrderItem[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Estado para pago en efectivo
    const [isCashPaymentOpen, setIsCashPaymentOpen] = useState(false)
    const [cashAmount, setCashAmount] = useState('')
    const [change, setChange] = useState(0)

    // Estado para pago mixto
    const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false)
    const [splitCashAmount, setSplitCashAmount] = useState('')
    const [splitCashReceived, setSplitCashReceived] = useState('')
    const [splitCardAmount, setSplitCardAmount] = useState(0)
    const [splitChange, setSplitChange] = useState(0)

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const addToCart = (product: SerializedProduct) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id)
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === productId)
            if (existing && existing.quantity > 1) {
                return prev.map((item) =>
                    item.product.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
            }
            return prev.filter((item) => item.product.id !== productId)
        })
    }

    const total = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    )

    const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setCashAmount(value)
        const amount = parseFloat(value)
        if (!isNaN(amount)) {
            setChange(amount - total)
        } else {
            setChange(0)
        }
    }

    const handleCashClick = () => {
        setCashAmount('')
        setChange(0)
        setIsCashPaymentOpen(true)
    }

    const handleSplitPaymentClick = () => {
        setSplitCashAmount('')
        setSplitCashReceived('')
        setSplitCardAmount(total)
        setSplitChange(0)
        setIsSplitPaymentOpen(true)
    }

    const handleSplitCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSplitCashAmount(value)
        const cashPart = parseFloat(value) || 0
        const cardPart = total - cashPart
        setSplitCardAmount(cardPart >= 0 ? cardPart : 0)
    }

    const handleSplitCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSplitCashReceived(value)
        const received = parseFloat(value) || 0
        const cashPart = parseFloat(splitCashAmount) || 0
        setSplitChange(received - cashPart)
    }

    const handleSubmit = async (
        paymentMethod: string,
        cashDetails?: { received: number, change: number },
        splitDetails?: { cashAmount: number, cardAmount: number, cashReceived?: number, change?: number }
    ) => {
        if (cart.length === 0) return

        setLoading(true)
        try {
            await createOrder({
                userId,
                paymentMethod,
                cashReceived: cashDetails?.received || splitDetails?.cashReceived,
                changeGiven: cashDetails?.change || splitDetails?.change,
                cashAmount: splitDetails?.cashAmount,
                cardAmount: splitDetails?.cardAmount,
                items: cart.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price,
                })),
            })
            setCart([])
            setIsCashPaymentOpen(false)
            setIsSplitPaymentOpen(false)

            let description = `Total: ${formatPrice(total)}`
            if (splitDetails) {
                description += ` | Efectivo: ${formatPrice(splitDetails.cashAmount)} | Tarjeta: ${formatPrice(splitDetails.cardAmount)}`
                if (splitDetails.change && splitDetails.change > 0) {
                    description += ` | Cambio: ${formatPrice(splitDetails.change)}`
                }
            } else if (cashDetails) {
                description += ` | Cambio: ${formatPrice(cashDetails.change)}`
            } else {
                description += ` - ${paymentMethod}`
            }

            toast.success('¡Pedido enviado exitosamente!', {
                description,
                duration: 4000,
            })
        } catch (error) {
            console.error(error)
            toast.error('Error al enviar el pedido', {
                description: 'Por favor, intenta nuevamente',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            {/* Products Grid */}
            <div className="mb-6">
                <div className="flex flex-col gap-4 mb-4">
                    <h2 className="text-2xl font-bold">Productos Disponibles</h2>

                    {/* Buscador */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar bebida, comida..."
                            className="pl-10 bg-white border-slate-200 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <p className="text-slate-500">No se encontraron productos con "{searchTerm}"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map((product) => (
                            <Card
                                key={product.id}
                                className="p-4 cursor-pointer hover:shadow-lg transition-shadow active:scale-95 flex flex-col justify-between"
                                onClick={() => addToCart(product)}
                            >
                                <div>
                                    <h3 className="font-semibold text-lg mb-1 leading-tight">{product.name}</h3>
                                    <Badge variant="outline" className="mb-2 text-xs">
                                        Stock: {product.stock}
                                    </Badge>
                                </div>
                                <p className="text-xl font-bold text-primary mt-1">
                                    {formatPrice(product.price)}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
                <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingCart className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Pedido Actual</h3>
                        </div>

                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                            {cart.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="flex items-center justify-between bg-slate-50 p-2 rounded"
                                >
                                    <span className="font-medium">{item.product.name}</span>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFromCart(item.product.id)}
                                        >
                                            <MinusCircle className="w-5 h-5" />
                                        </Button>
                                        <span className="font-bold w-8 text-center">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => addToCart(item.product)}
                                        >
                                            <PlusCircle className="w-5 h-5" />
                                        </Button>
                                        <span className="font-semibold w-20 text-right">
                                            {formatPrice(item.product.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mb-4 text-xl font-bold">
                            <span>Total:</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                        </div>

                        {/* Botones Principales con Pago Mixto */}
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                size="lg"
                                onClick={handleCashClick}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-sm"
                            >
                                <Banknote className="w-4 h-4 mr-1" />
                                Efectivo
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleSplitPaymentClick}
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-sm"
                            >
                                💰 Mixto
                            </Button>
                            <Button
                                size="lg"
                                onClick={() => handleSubmit('TARJETA')}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
                            >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Tarjeta
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Pago en Efectivo */}
            <Dialog open={isCashPaymentOpen} onOpenChange={setIsCashPaymentOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pago en Efectivo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                            <span>Total a Pagar:</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cash-amount">¿Cuánto entrega el cliente?</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                <Input
                                    id="cash-amount"
                                    type="number"
                                    placeholder="Ingrese monto..."
                                    className="pl-8 text-lg"
                                    value={cashAmount}
                                    onChange={handleCashAmountChange}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {parseFloat(cashAmount) > 0 && (
                            <div className={`p-4 rounded-lg border ${change >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-700">Cambio a devolver:</span>
                                    <span className={`text-2xl font-bold ${change >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                        {formatPrice(change >= 0 ? change : 0)}
                                    </span>
                                </div>
                                {change < 0 && (
                                    <p className="text-xs text-red-500 mt-1 text-right">Faltan {formatPrice(Math.abs(change))}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        {/* Opciones de Confirmación para Efectivo */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleSubmit('EFECTIVO')}
                                disabled={loading}
                                className="border-green-200 hover:bg-green-50 text-green-700"
                            >
                                ⚡ Pago Exacto
                            </Button>
                            <Button
                                onClick={() => handleSubmit('EFECTIVO', { received: parseFloat(cashAmount), change })}
                                disabled={loading || parseFloat(cashAmount) < total || isNaN(parseFloat(cashAmount))}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                ✅ Confirmar con Cambio
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => setIsCashPaymentOpen(false)} className="w-full">
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Pago Mixto */}
            <Dialog open={isSplitPaymentOpen} onOpenChange={setIsSplitPaymentOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pago Mixto (Efectivo + Tarjeta)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                            <span>Total a Pagar:</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="split-cash-amount">Monto en Efectivo</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                <Input
                                    id="split-cash-amount"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-8 text-lg"
                                    value={splitCashAmount}
                                    onChange={handleSplitCashAmountChange}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700">Monto en Tarjeta:</span>
                                <span className="text-xl font-bold text-purple-700">
                                    {formatPrice(splitCardAmount)}
                                </span>
                            </div>
                        </div>

                        {parseFloat(splitCashAmount) > 0 && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="split-cash-received">¿Cuánto entrega en efectivo?</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                        <Input
                                            id="split-cash-received"
                                            type="number"
                                            placeholder="Ingrese monto..."
                                            className="pl-8 text-lg"
                                            value={splitCashReceived}
                                            onChange={handleSplitCashReceivedChange}
                                        />
                                    </div>
                                </div>

                                {parseFloat(splitCashReceived) > 0 && (
                                    <div className={`p-4 rounded-lg border ${splitChange >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-slate-700">Cambio a devolver:</span>
                                            <span className={`text-2xl font-bold ${splitChange >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {formatPrice(splitChange >= 0 ? splitChange : 0)}
                                            </span>
                                        </div>
                                        {splitChange < 0 && (
                                            <p className="text-xs text-red-500 mt-1 text-right">Faltan {formatPrice(Math.abs(splitChange))}</p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter className="flex flex-col gap-3">
                        <Button
                            onClick={() => {
                                const cashPart = parseFloat(splitCashAmount) || 0
                                const cardPart = splitCardAmount
                                const received = parseFloat(splitCashReceived) || cashPart
                                const change = received - cashPart

                                handleSubmit('MIXTO', undefined, {
                                    cashAmount: cashPart,
                                    cardAmount: cardPart,
                                    cashReceived: cashPart > 0 ? received : undefined,
                                    change: cashPart > 0 && change > 0 ? change : undefined
                                })
                            }}
                            disabled={
                                loading ||
                                parseFloat(splitCashAmount) < 0 ||
                                splitCardAmount < 0 ||
                                (parseFloat(splitCashAmount) > 0 && parseFloat(splitCashReceived) < parseFloat(splitCashAmount))
                            }
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            ✅ Confirmar Pago Mixto
                        </Button>
                        <Button variant="ghost" onClick={() => setIsSplitPaymentOpen(false)} className="w-full">
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
