-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_origem_idx" ON "Lead"("origem");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_nome_idx" ON "Lead"("nome");

-- CreateIndex
CREATE INDEX "MovimentacaoCaixa_tipo_status_data_idx" ON "MovimentacaoCaixa"("tipo", "status", "data");

-- CreateIndex
CREATE INDEX "MovimentacaoCaixa_data_idx" ON "MovimentacaoCaixa"("data");

-- CreateIndex
CREATE INDEX "MovimentacaoCaixa_status_idx" ON "MovimentacaoCaixa"("status");

-- CreateIndex
CREATE INDEX "Projeto_statusProducao_idx" ON "Projeto"("statusProducao");

-- CreateIndex
CREATE INDEX "Projeto_updatedAt_idx" ON "Projeto"("updatedAt");

-- CreateIndex
CREATE INDEX "Projeto_leadId_idx" ON "Projeto"("leadId");

-- CreateIndex
CREATE INDEX "Projeto_createdAt_idx" ON "Projeto"("createdAt");
