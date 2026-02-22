-- AlterEnum
ALTER TYPE "StatusProducao" ADD VALUE 'FITAGEM';

-- CreateTable
CREATE TABLE "MaterialProjeto" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER DEFAULT 1,
    "ordem" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialProjeto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MaterialProjeto" ADD CONSTRAINT "MaterialProjeto_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
