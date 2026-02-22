-- CreateEnum
CREATE TYPE "StatusSugestao" AS ENUM ('NOVA', 'EM_DISCUSSAO', 'APROVADA', 'IMPLEMENTADA', 'ARQUIVADA');

-- CreateTable
CREATE TABLE "SugestaoMelhoria" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "etapa" TEXT,
    "usuarioId" TEXT NOT NULL,
    "projetoId" TEXT,
    "status" "StatusSugestao" NOT NULL DEFAULT 'NOVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SugestaoMelhoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SugestaoMelhoria" ADD CONSTRAINT "SugestaoMelhoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SugestaoMelhoria" ADD CONSTRAINT "SugestaoMelhoria_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
