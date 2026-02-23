# Melhorias por setor da sidebar (AIOS)

Sugestões de melhoria para cada tópico do menu lateral, com indicação de qual agente AIOS pode ajudar. Documento vivo para uso com @pm, @ux-design-expert, @analyst, @qa, @sm, @dev.

---

## Início (Dashboard)

**Hoje:** Cards (a receber, faturado, pendente, entregues com pendência), funil de leads (por status e origem), gráficos (leads por mês, faturamento por mês), produção por etapa, avisos (contas a vencer, leads com orçamento sem projeto), lista de projetos em produção.

**Sugestões por agente:**
- **@pm** – Definir KPIs e metas (ex.: meta de conversão lead→projeto, SLA por etapa).
- **@ux-design-expert** – Melhorar hierarquia visual, responsividade e leitura rápida (cores, tamanhos, agrupamento).
- **@analyst** – Comparar com benchmarks (conversão, tempo no funil) e sugerir métricas adicionais.
- **@qa** – Garantir que os números batem com as fontes (leads, projetos, pagamentos) e testar cenários de dados vazios.

**Melhorias gerais:** Filtro por período; drill-down (clicar no card e ir para lista filtrada); exportar resumo em PDF (já está no backlog do PRD).

---

## Vendas

### Leads

**Hoje:** Lista com filtro status/origem, exportar CSV, novo lead, detalhe com atividades, conversão em projeto.

**Sugestões:**
- **@ux-design-expert** – Kanban por status (arrastar lead entre etapas), busca por nome/telefone, “último contato” em destaque.
- **@pm** – Novos status ou substatus (ex.: “Orçamento visualizado”), tempo médio por etapa.
- **@sm** – Histórias para “lembrete de follow-up” (X dias sem contato) e notificação quando lead converte.

### Projetos

**Hoje:** Lista, detalhe (resumo, financeiro, arquivos, compras), pagamentos, checklist.

**Sugestões:**
- **@ux-design-expert** – Filtros (status produção, valor, período), busca, coluna “valor pendente” na lista.
- **@dev / @architect** – Unificar APIs (projetos vs projects), conforme PRD.
- **@qa** – Testes E2E do fluxo lead → projeto → pagamento e da lista com filtros.

---

## Operação

### Produção

**Hoje:** Colunas por etapa (Aguardando arquivos → Entregue), avançar etapa, link para projeto.

**Sugestões:**
- **@ux-design-expert** – Drag-and-drop entre colunas, data de previsão de entrega visível no card, filtro por etapa.
- **@pm** – SLA por etapa (ex.: “Corte em até 3 dias”), indicador de atraso.
- **@dev** – Upload de arquivos para storage externo (S3/Blob), como no backlog.

### Estoque (Compras)

**Hoje:** Itens com quantidade mínima/atual, alertas “abaixo do mínimo”, CRUD simples.

**Sugestões:**
- **@ux-design-expert** – Ordenar alertas por urgência, histórico de alteração de quantidade.
- **@pm** – Vincular item a “categoria” ou “projeto tipo” para relatório de consumo.
- **@data-engineer** – Se no futuro houver integração com planilhas/ERP, definir modelo de dados.

---

## Financeiro (Fluxo de caixa)

**Hoje:** Resumo do mês, abas (Contas a pagar, Lançamentos com entradas/saídas separadas, Relatório), entradas de projetos na lista.

**Sugestões:**
- **@ux-design-expert** – Gráfico mensal (entradas x saídas), previsão de caixa (próximos 30 dias).
- **@pm** – Regras de alerta (ex.: saldo negativo ou contas a vencer em 7 dias).
- **@qa** – Conferir totais do relatório com a soma das movimentações e com pagamentos de projetos.

---

## Suporte

### Telefones úteis

**Hoje:** Lista nome/telefone, link WhatsApp, CRUD.

**Sugestões:**
- **@ux-design-expert** – Busca, agrupamento por categoria (serralheiro, frete, etc.) se fizer sentido.
- **@dev** – Botão “Ligar” (tel:) no mobile.

### Sugestões (melhoria)

**Hoje:** Lista com status (Nova → Arquivada), filtro, criar sugestão vinculada a etapa/projeto.

**Sugestões:**
- **@ux-design-expert** – Badge de quantidade por status, ordenação por data, link direto para o projeto.
- **@sm** – Fluxo de “Sugestão aprovada” → criar tarefa/epic (se integrar com backlog).
- **@pm** – Métrica “sugestões implementadas por trimestre”.

---

## Configuração

### Dados da empresa

**Hoje:** Formulário único (CNPJ, endereço, telefone, site, Instagram).

**Sugestões:** **@ux-design-expert** – Validação em tempo real (CNPJ, URL); **@qa** – Testes de salvamento e exibição no footer.

### Credenciais

**Hoje:** Lista por categoria/serviço, login/senha criptografada, CRUD.

**Sugestões:** **@ux-design-expert** – Senha oculta com “mostrar”; **@qa** – **@security-check** para não vazar senha em log/response.

### Importar planilhas

**Hoje:** Upload de planilhas (clientes, orçamentos, produção, financeiro).

**Sugestões:** **@ux-design-expert** – Template CSV para download, mensagens de erro por linha; **@data-engineer** – Documentar formato e validações; **@qa** – Testes com arquivo inválido e válido.

### Usuários

**Hoje:** Lista, criar/editar (nome, email, role), trocar senha.

**Sugestões:** **@ux-design-expert** – Indicador “último acesso” (se houver log); **@qa** – Testes de permissão por role (acesso às rotas da sidebar).

---

## Resumo: qual agente usar por setor

| Setor         | Priorização / escopo | UX / UI             | Qualidade / testes | Histórias / fluxos |
|---------------|----------------------|---------------------|--------------------|---------------------|
| Início        | @pm                  | @ux-design-expert   | @qa                | @sm                 |
| Vendas        | @pm                  | @ux-design-expert   | @qa                | @sm                 |
| Operação      | @pm                  | @ux-design-expert   | @qa                | @sm                 |
| Financeiro    | @pm                  | @ux-design-expert   | @qa                | —                   |
| Suporte       | @pm                  | @ux-design-expert   | —                  | @sm                 |
| Configuração  | —                    | @ux-design-expert   | @qa                | —                   |

**Implementação:** @dev ou @aios-developer  
**Arquitetura:** @architect  
**Pesquisa / métricas:** @analyst

---

*Atualizar conforme o produto e os agentes evoluem.*
