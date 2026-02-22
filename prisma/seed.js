const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await hash('camarpe123', 12);
  const users = [
    { email: 'samuel@camarpe.com', name: 'Samuel', role: 'COMERCIAL' },
    { email: 'marcelo@camarpe.com', name: 'Marcelo', role: 'PRODUCAO' },
    { email: 'gestao@camarpe.com', name: 'Gestão', role: 'GESTAO' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password },
    });
  }
  console.log('Usuários criados. Senha padrão: camarpe123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
