import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Redirigir según el rol del usuario
  if (session.user.role === "ADMIN") {
    redirect("/dashboard")
  } else {
    redirect("/waiter")
  }
}
