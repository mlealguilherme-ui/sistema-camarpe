import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { encrypt } from '../src/lib/encrypt';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await hash('camarpe123', 12);
  await prisma.usuario.upsert({
    where: { email: 'comercial@camarpe.com' },
    update: { nome: 'Comercial' },
    create: {
      email: 'comercial@camarpe.com',
      senhaHash,
      nome: 'Comercial',
      role: 'COMERCIAL',
    },
  });
  await prisma.usuario.upsert({
    where: { email: 'producao@camarpe.com' },
    update: { nome: 'Produção' },
    create: {
      email: 'producao@camarpe.com',
      senhaHash,
      nome: 'Produção',
      role: 'PRODUCAO',
    },
  });
  await prisma.usuario.upsert({
    where: { email: 'gestao@camarpe.com' },
    update: { nome: 'Gestão' },
    create: {
      email: 'gestao@camarpe.com',
      senhaHash,
      nome: 'Gestão',
      role: 'GESTAO',
    },
  });
  await prisma.usuario.upsert({
    where: { email: 'admin@camarpe.com' },
    update: { nome: 'Administrador' },
    create: {
      email: 'admin@camarpe.com',
      senhaHash,
      nome: 'Administrador',
      role: 'ADMIN',
    },
  });
  console.log('Usuários: comercial@, producao@, gestao@, admin@camarpe.com. Senha padrão: camarpe123');

  // Dados institucionais (único registro)
  const dados = await prisma.dadosInstitucionais.findFirst();
  const dadosPayload = {
    cnpj: '54.162.932/0001-60',
    endereco: 'R. Pedro da Costa Ribeiro, 496 - Vargem Grande II, Montes Claros - MG, CEP 39402-558',
    telefone: '(38) 98809-7949',
    site: 'grupocamarpe.com.br',
    instagram: '@grupocamarpe',
  };
  if (dados) {
    await prisma.dadosInstitucionais.update({ where: { id: dados.id }, data: dadosPayload });
  } else {
    await prisma.dadosInstitucionais.create({ data: dadosPayload });
  }
  console.log('Dados institucionais: ok');

  // Credenciais e acessos (senhas criptografadas) - só cria se ainda não houver nenhuma
  // ATENÇÃO: Não insira senhas reais no seed. Cadastre as credenciais manualmente pelo sistema.
  const countCred = await prisma.credencialAcesso.count();
  if (countCred === 0) {
    const credenciais = [
      { categoria: 'E-mail e Contas Principais', servico: 'Conta Microsoft', login: 'email@empresa.com', senha: 'ALTERAR_SENHA' },
      { categoria: 'E-mail e Contas Principais', servico: 'Gmail (Google)', login: 'email@empresa.com', senha: 'ALTERAR_SENHA' },
      { categoria: 'Cursos e Treinamentos', servico: 'Hotmart', login: 'email@empresa.com', senha: 'ALTERAR_SENHA' },
      { categoria: 'Cursos e Treinamentos', servico: 'Instagram', login: null as string | null, senha: 'ALTERAR_SENHA' },
    ];
    for (const c of credenciais) {
      await prisma.credencialAcesso.create({
        data: {
          categoria: c.categoria,
          servico: c.servico,
          login: c.login,
          senhaCriptografada: encrypt(c.senha),
        },
      });
    }
    console.log('Credenciais: criadas com senhas placeholder — altere pelo sistema');
  }

  // Telefones úteis
  const contatos = [
    { nome: 'Anderson Central de Serviço', telefone: '38999275417' },
    { nome: 'Diney Serralheiro', telefone: '3899836316' },
    { nome: 'Ferragens Colonial', telefone: '3832223751' },
    { nome: 'Ferragens Cordeiro', telefone: '38999754682' },
    { nome: 'Franklin Vanorte', telefone: '38984037286' },
    { nome: 'Greyce Casa do Marceneiro', telefone: '38999161800' },
    { nome: 'Helio Frete', telefone: '38999888356' },
    { nome: 'Leandro Vidraceiro', telefone: '38988039280' },
    { nome: 'Leclis Gerente Leo', telefone: '38988594871' },
    { nome: 'Lucas Assentador', telefone: '38999640924' },
    { nome: 'Marmoraria São Caetano', telefone: '38997486804' },
    { nome: 'Tiago GMAD', telefone: '38991492772' },
    { nome: 'Wil Leo Matão', telefone: '38997466419' },
    { nome: 'Xavier Capas MDF', telefone: '38992023196' },
  ];
  for (const c of contatos) {
    const exists = await prisma.contatoUtil.findFirst({ where: { nome: c.nome, telefone: c.telefone } });
    if (!exists) {
      await prisma.contatoUtil.create({ data: c });
    }
  }
  console.log('Telefones úteis: ok');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
