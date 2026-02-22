# Enviar o projeto para o GitHub

## 1. Instalar o Git (se ainda não tiver)

- Baixe em: https://git-scm.com/download/win  
- Instale e **reabra** o terminal (PowerShell ou CMD) depois.

## 2. Criar o repositório no GitHub

1. Acesse https://github.com e faça login.
2. Clique em **"+"** (canto superior direito) → **"New repository"**.
3. Dê um nome (ex: `sistema-camarpe`).
4. Deixe **público** se quiser que outros vejam.
5. **Não** marque "Add a README" (o projeto já tem arquivos).
6. Clique em **"Create repository"**.

O GitHub vai mostrar uma URL do repositório, algo como:
`https://github.com/SEU_USUARIO/sistema-camarpe.git`

## 3. Rodar os comandos no seu PC

Abra **PowerShell** ou **CMD**, vá até a pasta do projeto e execute **um comando por vez**:

```powershell
cd c:\Users\monte\sistema-camarpe

git init
git add .
git commit -m "Primeiro commit - Sistema Camarpe"
git branch -M main
git remote add origin https://github.com/mlealguilherme-ui/sistema-camarpe.git
git push -u origin main
```

(Repositório: [mlealguilherme-ui/sistema-camarpe](https://github.com/mlealguilherme-ui/sistema-camarpe))

Na primeira vez, o `git push` pode pedir login no GitHub (usuário e senha ou token). Use seu usuário e um **Personal Access Token** como senha (em GitHub → Settings → Developer settings → Personal access tokens).

---

Pronto. Depois disso o código estará no GitHub e você poderá compartilhar o link do repositório.
