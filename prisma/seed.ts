import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const userData: Prisma.UserCreateInput[] = [
  {
    email: 'mark@example.com',
    firstName: 'Mark',
    lastName: 'Smith',
    password: '$2b$10$Xx.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.Q.',
  }, 
]


const shareData: Prisma.ShareCreateInput[] = [
  {
    name: 'Apple',
    symbol: 'APL',
    price: 90.88,
  },
  {
    name: 'Microsoft',
    symbol: 'MST',
    price: 80.77,
  },
  {
    name: 'Google',
    symbol: 'GOG',
    price: 70.66,
  },
  {
    name: 'Facebook',
    symbol: 'FBK',
    price: 60.55,
  },
]

const assetData: Prisma.AssetCreateInput[] = [
  {
    share: {
      connect: {
        symbol: 'APL',
      },
    },
    portfolio: {
      create: {
        user: {
          connect: {
            email: 'mark@example.com',
          },
        },
        default: true,
      },
    },
    unit: 50,
    trades: {
      create: [
        {
          sharePrice: 90.88,
          unit: 100,
          isBuy: true,
          amount: 9088.00,

        },
        {
          sharePrice: 90.88,
          unit: 50,
          isBuy: false,
          amount: 4544.00,
        },
      ],
    },
    active: true,
  },
]

async function main() {
  console.log(`Start seeding ...`)
  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    })
    console.log(`Created user with id: ${user.id}`)
  }

  for (const s of shareData) {
    const share = await prisma.share.create({
      data: s,
    })
    console.log(`Created share with id: ${share.id}`)
  }

  for (const a of assetData) {
    const asset = await prisma.asset.create({
      data: a,
    })
    console.log(`Created asset with id: ${asset.id}`)
  }

  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
