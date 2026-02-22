-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COMERCIAL', 'PRODUCAO', 'GESTAO', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrigemLead" AS ENUM ('INDICACAO', 'INSTAGRAM', 'ARQUITETO', 'FACEBOOK', 'SITE');

-- CreateEnum
CREATE TYPE "TipoAtividadeLead" AS ENUM ('LIGACAO', 'EMAIL_ENVIADO', 'ORCAMENTO_ENVIADO', 'CONTATO_WHATSAPP', 'OBSERVACAO');

-- CreateEnum
CREATE TYPE "StatusLead" AS ENUM ('LEAD', 'ORCAMENTO_ENVIADO', 'CONTRATO_ASSINADO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "StatusProducao" AS ENUM ('AGUARDANDO_ARQUIVOS', 'PARA_CORTE', 'MONTAGEM', 'INSTALACAO', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "TipoPagamento" AS ENUM ('ENTRADA', 'FINAL');

-- CreateEnum
CREATE TYPE "TipoArquivo" AS ENUM ('GCODE', 'TRES_D', 'PDF_CORTE', 'CONTRATO');

-- CreateEnum
CREATE TYPE "TipoMovimentacaoCaixa" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "StatusMovimentacaoCaixa" AS ENUM ('PREVISTO', 'PAGO');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('SALARIO', 'CONTAS_FIXAS', 'FORNECEDORES', 'INVESTIMENTO_EQUIPAMENTO', 'INVESTIMENTO_APLICACAO', 'IMPOSTOS', 'OUTROS');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT NOT NULL,
    "origem" "OrigemLead" NOT NULL,
    "status" "StatusLead" NOT NULL DEFAULT 'LEAD',
    "motivoPerda" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAtividade" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipo" "TipoAtividadeLead" NOT NULL,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAtividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "nome" TEXT NOT NULL,
    "statusProducao" "StatusProducao" NOT NULL DEFAULT 'AGUARDANDO_ARQUIVOS',
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "valorEntradaPago" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorPendente" DECIMAL(12,2) NOT NULL,
    "dataPagamentoFinalPrevista" TIMESTAMP(3),
    "dataEntregaPrevista" TIMESTAMP(3),
    "dataEntregaReal" TIMESTAMP(3),
    "custoMateriais" DECIMAL(12,2),
    "custoMaoObra" DECIMAL(12,2),
    "margemPct" DECIMAL(5,2),
    "qtdChapasMdf" INTEGER,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetoStatusLog" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "deStatus" "StatusProducao" NOT NULL,
    "paraStatus" "StatusProducao" NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetoStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "tipo" "TipoPagamento" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arquivo" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "tipo" "TipoArquivo" NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistCompras" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "chapasCompradas" BOOLEAN NOT NULL DEFAULT false,
    "ferragensCompradas" BOOLEAN NOT NULL DEFAULT false,
    "outrosItens" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistCompras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemEstoqueAlerta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidadeMinima" INTEGER NOT NULL,
    "quantidadeAtual" INTEGER NOT NULL DEFAULT 0,
    "avisoAtivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemEstoqueAlerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRecuperacaoSenha" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRecuperacaoSenha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoCaixa" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimentacaoCaixa" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "categoria" "CategoriaDespesa",
    "descricao" TEXT NOT NULL,
    "referenciaSalario" TEXT,
    "status" "StatusMovimentacaoCaixa" NOT NULL DEFAULT 'PREVISTO',
    "projetoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentacaoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_leadId_key" ON "Projeto"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistCompras_projetoId_key" ON "ChecklistCompras"("projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenRecuperacaoSenha_token_key" ON "TokenRecuperacaoSenha"("token");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAtividade" ADD CONSTRAINT "LeadAtividade_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAtividade" ADD CONSTRAINT "LeadAtividade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoStatusLog" ADD CONSTRAINT "ProjetoStatusLog_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoStatusLog" ADD CONSTRAINT "ProjetoStatusLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCompras" ADD CONSTRAINT "ChecklistCompras_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenRecuperacaoSenha" ADD CONSTRAINT "TokenRecuperacaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoCaixa" ADD CONSTRAINT "MovimentacaoCaixa_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
