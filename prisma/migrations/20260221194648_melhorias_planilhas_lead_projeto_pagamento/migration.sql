-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrigemLead" ADD VALUE 'AMIGO';
ALTER TYPE "OrigemLead" ADD VALUE 'FAMILIAR';
ALTER TYPE "OrigemLead" ADD VALUE 'PARCEIRO';

-- AlterEnum
ALTER TYPE "StatusProducao" ADD VALUE 'PAUSADO';

-- DropIndex
DROP INDEX "Projeto_leadId_key";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "dataUltimoContato" TIMESTAMP(3),
ADD COLUMN     "descricaoProjeto" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "linkOrcamento" TEXT,
ADD COLUMN     "linkProjeto3d" TEXT,
ADD COLUMN     "observacoes" TEXT;

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "dataVencimento" TIMESTAMP(3),
ADD COLUMN     "linkComprovante" TEXT,
ALTER COLUMN "data" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Projeto" ADD COLUMN     "dataInicioProducao" TIMESTAMP(3),
ADD COLUMN     "linkOrcamento" TEXT,
ADD COLUMN     "linkProjeto3d" TEXT,
ADD COLUMN     "observacoes" TEXT;
