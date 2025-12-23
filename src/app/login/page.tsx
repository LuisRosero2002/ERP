import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
    const session = await auth()

    if (session?.user) {
        // Redirigir según el rol
        if (session.user.role === "ADMIN") {
            redirect("/dashboard")
        } else {
            redirect("/waiter")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-2xl rounded-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                            Sistema ERP
                        </h1>
                        <p className="text-slate-600">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>
                    <LoginForm />
                </div>
                <div className="mt-6 text-center text-sm text-slate-600">
                    <p>Usuarios de prueba:</p>
                    <p className="mt-2">
                        <strong>Admin:</strong> admin@erp.com / admin123
                    </p>
                    <p>
                        <strong>Mesero:</strong> mesero@erp.com / mesero123
                    </p>
                </div>
            </div>
        </div>
    )
}
