import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });


async function main() {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10)

    // Create Admin User
    await prisma.user.upsert({
        where: { email: 'admin@erp.com' },
        update: {},
        create: {
            email: 'admin@erp.com',
            name: 'Administrador',
            password: adminPassword,
            role: 'ADMIN',
        },
    })

    // Lista de Meseros
    const waitersList = [
        { name: 'Luis', email: 'luis@erp.com', password: 'luis123' },
        { name: 'Santiago I', email: 'santiago@erp.com', password: 'santiago123' },
        { name: 'David Santiago', email: 'david@erp.com', password: 'david123' },
        { name: 'Camila', email: 'camila@erp.com', password: 'camila123' },
    ]

    const createdWaiters = []

    for (const w of waitersList) {
        const hashedPassword = await bcrypt.hash(w.password, 10)
        const user = await prisma.user.upsert({
            where: { email: w.email },
            update: {},
            create: {
                email: w.email,
                name: w.name,
                password: hashedPassword,
                role: 'WAITER',
            },
        })
        createdWaiters.push(user)
    }

    // Create Categories
    const drinks = await prisma.category.upsert({
        where: { id: 'drinks-category' },
        update: {},
        create: {
            id: 'drinks-category',
            name: 'Bebidas'
        },
    })

    const food = await prisma.category.upsert({
        where: { id: 'food-category' },
        update: {},
        create: {
            id: 'food-category',
            name: 'Comida',
        },
    })

    console.log('\n✅ Database seeded successfully!')
    console.log('\n👤 Usuarios creados:')
    console.log('------------------------------------------------')
    console.log(`ADMIN   | Admin         | admin@erp.com     | admin123`)
    console.log('------------------------------------------------')
    waitersList.forEach(w => {
        console.log(`MESERO  | ${w.name.padEnd(13)} | ${w.email.padEnd(17)} | ${w.password}`)
    })
    console.log('------------------------------------------------')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
