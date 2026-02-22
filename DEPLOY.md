# Colocar o sistema online (Vercel + Neon)

## 1. Banco Neon já criado

Você já tem o projeto **camarpe** na Neon com a connection string. Guarde essa URL em lugar seguro (não suba no GitHub).

## 2. Rodar as migrations no banco Neon (no seu PC)

No seu computador, **uma vez**:

1. Abra o arquivo **`.env`** na pasta do projeto.
2. Coloque ou altere a linha **`DATABASE_URL`** para a URL do Neon (a connection string que você copiou). Exemplo de formato:
   ```
   DATABASE_URL="postgresql://usuario:senha@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
   ```
3. No terminal, na pasta do projeto, rode:
   ```bash
   npx prisma migrate deploy
   ```
   Isso cria todas as tabelas no banco da Neon.

## 3. Variáveis na Vercel

No projeto na Vercel (**Settings** → **Environment Variables**), cadastre:

| Nome | Valor | Observação |
|------|--------|------------|
| `DATABASE_URL` | A **mesma** connection string da Neon | Obrigatório |
| `JWT_SECRET` | Uma string aleatória longa (mín. 32 caracteres) | Ex: gere em https://generate-secret.vercel.app/32 |
| `ENCRYPTION_KEY` | Outra string de 32 caracteres | Para criptografia de credenciais |
| `NEXT_PUBLIC_APP_URL` | A URL do app na Vercel | Ex: `https://seu-projeto.vercel.app` (preencha depois do 1º deploy) |

## 4. Build na Vercel

O projeto já tem o script **`vercel-build`** no `package.json`. A Vercel usa esse script automaticamente no deploy (roda `prisma generate` antes do build). **Não precisa** alterar Build Command no painel.

## 5. Primeiro usuário (seed) — pela Vercel

Depois do deploy, o banco na Neon estará vazio. Para criar os usuários **sem precisar rodar nada no seu PC**:

1. Na Vercel, em **Settings** → **Environment Variables**, adicione:
   - **Nome:** `SEED_SECRET`
   - **Valor:** uma senha que só você saiba (ex: `minha-senha-seed-2025`). Anote essa senha.

2. Faça um **Redeploy** do projeto (para a variável ser aplicada).

3. No navegador, abra (troque pela **sua** URL do app e pela **sua** senha):
   ```
   https://SEU-APP.vercel.app/api/seed?secret=minha-senha-seed-2025
   ```
   Se der certo, a página mostra algo como: `{"ok":true,"message":"Usuários criados..."}`.

4. Faça login no app com:
   - **E-mail:** `admin@camarpe.com`
   - **Senha:** `camarpe123`

Depois de criar os usuários, você pode remover a variável `SEED_SECRET` na Vercel se quiser (a rota passa a retornar 403 sem ela).

---

## Checklist (o que você faz)

- [ ] Na Vercel: variáveis **DATABASE_URL**, **JWT_SECRET**, **ENCRYPTION_KEY**, **NEXT_PUBLIC_APP_URL**.
- [ ] Adicionar **SEED_SECRET** na Vercel (senha secreta para criar usuários).
- [ ] Redeploy, depois abrir no navegador: `https://SEU-APP.vercel.app/api/seed?secret=SUA_SENHA`.
- [ ] Login no app: **admin@camarpe.com** / **camarpe123**.
