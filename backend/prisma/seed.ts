// prisma/seed.ts
import { PrismaClient, Role, Category } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.user.count()
  if (count > 0) { console.log('Database already seeded.'); return }

  console.log('Seeding database...')

  const hash = (p: string) => bcrypt.hashSync(p, 10)

  await prisma.user.createMany({
    data: [
      { username: 'admin',    password: hash('Admin@123'),   role: Role.admin,   name: 'Admin User' },
      { username: 'cashier1', password: hash('Cashier@123'), role: Role.cashier, name: 'Cashier One' },
      { username: 'waiter1',  password: hash('Waiter@123'),  role: Role.waiter,  name: 'Waiter One' },
      { username: 'waiter2',  password: hash('Waiter@123'),  role: Role.waiter,  name: 'Waiter Two' },
    ],
  })

  await prisma.menuItem.createMany({
    data: [
      { name: 'Pad Thai',          description: 'Classic Thai stir-fried noodles',  price: 80,  category: Category.food },
      { name: 'Tom Yum Soup',      description: 'Spicy Thai soup with shrimp',       price: 120, category: Category.food },
      { name: 'Green Curry',       description: 'Thai green curry with coconut milk',price: 110, category: Category.food },
      { name: 'Fried Rice',        description: 'Thai-style fried rice with egg',    price: 75,  category: Category.food },
      { name: 'Spring Rolls',      description: 'Crispy vegetable spring rolls (6)', price: 65,  category: Category.food },
      { name: 'Mango Sticky Rice', description: 'Sweet dessert with fresh mango',    price: 60,  category: Category.dessert },
      { name: 'Coconut Ice Cream', description: 'Homemade coconut ice cream',        price: 55,  category: Category.dessert },
      { name: 'Fresh OJ',          description: '100% fresh squeezed orange juice',  price: 45,  category: Category.drink },
      { name: 'Thai Iced Tea',     description: 'Sweetened tea with condensed milk', price: 40,  category: Category.drink },
      { name: 'Singha Beer',       description: 'Thai lager 330ml',                  price: 70,  category: Category.drink },
    ],
  })

  for (let i = 1; i <= 10; i++) {
    await prisma.restaurantTable.create({
      data: { tableNumber: i, capacity: i <= 5 ? 4 : 6 },
    })
  }

  console.log('Seed complete.')
  console.log('Accounts: admin/Admin@123 | cashier1/Cashier@123 | waiter1/Waiter@123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
