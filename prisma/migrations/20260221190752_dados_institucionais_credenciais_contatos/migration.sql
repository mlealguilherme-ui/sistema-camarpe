-- CreateTable
CREATE TABLE "DadosInstitucionais" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "site" TEXT,
    "instagram" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DadosInstitucionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredencialAcesso" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "login" TEXT,
    "senhaCriptografada" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredencialAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContatoUtil" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContatoUtil_pkey" PRIMARY KEY ("id")
);
