const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst({
    include: {
      departments: {
        include: {
          employees: true
        }
      },
      employees: {
        where: { departmentId: null }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(business, null, 2));
}

main().finally(() => prisma.$disconnect());
