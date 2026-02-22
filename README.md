# Sistema de Gestão Camarpe — MVP 1.0

Sistema web para gestão de leads (CRM), projetos, financeiro 50/50, produção (Kanban + cofre de arquivos) e compras/estoque.

## Stack

- **Frontend e API:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Banco:** PostgreSQL com Prisma ORM
- **Autenticação:** JWT em cookie HTTP-only (perfis: Comercial, Produção, Gestão)

## Pré-requisitos

- Node.js 18+
- PostgreSQL

## Configuração

1. Clone ou acesse a pasta do projeto e instale as dependências:

```bash
cd sistema-camarpe
npm install
```

2. Crie o arquivo `.env` na raiz (copie de `.env.example`):

```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/camarpe?schema=public"
JWT_SECRET="uma-chave-secreta-longa-com-pelo-menos-32-caracteres"
UPLOAD_DIR="./uploads"
```

3. Crie o banco no PostgreSQL (ex.: `createdb camarpe`) e aplique o schema:

```bash
npx prisma generate
npx prisma db push
```

4. (Opcional) Crie usuários de teste (senha: `camarpe123`):

```bash
curl -X POST http://localhost:3000/api/seed
```

Ou, com o servidor rodando, faça um POST para `/api/seed`. Isso cria:

- **Samuel (Comercial):** samuel@camarpe.com
- **Marcelo (Produção):** marcelo@camarpe.com
- **Gestão:** gestao@camarpe.com

## Executar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Faça login e use o menu conforme seu perfil.

## Módulos

1. **CRM (Leads)** — Cadastro de leads, filtro por status/origem, fluxo Lead → Orçamento → Contrato/Perdido, motivo de perda, conversão Lead → Projeto.
2. **Projetos e financeiro** — Criação/edição de projeto, custo rápido (materiais + mão de obra + margem), valor total, painel 50/50 (entrada e pagamento final), alerta “entregue com pendência”, upload de contrato PDF.
3. **Produção** — Kanban (Aguardando arquivos → Para corte → Montagem → Instalação → Entregue), cofre do projeto (G-code, 3D, PDF corte, contrato), layout responsivo para uso no celular (Marcelo).
4. **Compras** — Checklist por projeto (chapas, ferragens, outros) na tela do projeto; tela de itens de estoque com quantidade mínima (alertas).
5. **Dashboard (Gestão/Comercial)** — Funil de vendas (quantidade por status, taxa de conversão) e resumo financeiro (faturado, pendente, entregues com pendência).

## Estrutura de pastas (resumo)

- `prisma/schema.prisma` — Modelo de dados
- `src/app/api/` — Rotas da API (auth, leads, projetos, pagamentos, arquivos, checklist, estoque-alerta, dashboard)
- `src/app/(app)/` — Páginas autenticadas (dashboard, leads, projetos, producao, compras)
- `src/app/login/` — Página de login
- `src/components/Layout.tsx` — Layout com menu e logout
- `src/lib/auth.ts` — Sessão JWT e cookies
- `src/lib/prisma.ts` — Cliente Prisma

## Permissões

- **Comercial (Samuel):** Leads, Projetos, Produção, Compras, Dashboard
- **Produção (Marcelo):** apenas Produção (visualizar e baixar arquivos)
- **Gestão:** Leads, Projetos, Dashboard (sem Produção/Compras no menu, mas a API pode ser ajustada)

## Armazenamento de arquivos

Os arquivos enviados ao cofre do projeto são salvos em disco na pasta definida em `UPLOAD_DIR` (ex.: `./uploads/{projetoId}/`). Em produção, considere usar um bucket S3-compatible e variável de ambiente para a URL base.
