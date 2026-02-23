# PRD – Sistema Camarpe (resumo)

## Visão do produto

Sistema de gestão para a Camarpe: funil de vendas (leads), projetos de produção, financeiro (pagamentos, fluxo de caixa), estoque e usuários com controle por perfil.

## Usuários e perfis

| Perfil     | Foco principal                                      |
|-----------|------------------------------------------------------|
| COMERCIAL | Leads, projetos, produção, estoque, sugestões        |
| PRODUCAO  | Produção, telefones úteis, sugestões                 |
| GESTAO    | Dashboard, leads, projetos, fluxo de caixa, usuários |
| ADMIN     | Tudo + credenciais, importar planilhas               |

## Principais fluxos

1. **Lead → Projeto:** Cadastro de lead, atividades, conversão em projeto (com valor/custos).
2. **Projeto:** Status de produção (aguardando arquivos → corte → montagem → fitagem → instalação → entregue), arquivos, pagamentos, materiais, checklist de compras.
3. **Financeiro:** Pagamentos por projeto, fluxo de caixa (entradas/saídas, previsão).
4. **Gestão:** Dashboard (leads, conversão, faturamento), usuários, dados institucionais, credenciais (ADMIN).

## Escopo atual (MVP)

- CRM de leads com origem, status e atividades
- Projetos vinculados a lead (opcional), com status de produção e valores
- Upload de arquivos por projeto (G-code, 3D, PDF, contrato)
- Pagamentos (entrada/final) e fluxo de caixa
- Listagem de produção, compras/estoque (alertas)
- Sugestões de melhoria por etapa
- Autenticação JWT por role; middleware protegendo rotas e APIs

## Melhorias priorizadas (backlog)

1. Unificar APIs duplicadas (projetos vs projects já em 410).
2. Upload em produção: usar storage externo (S3/Vercel Blob); hoje é filesystem (ok para dev).
3. Testes automatizados (APIs críticas + E2E de um fluxo principal).
4. Relatórios em PDF e notificações (ex.: projeto entregue com valor pendente).
5. Auditoria de alterações em dados sensíveis (opcional).

## Métricas de sucesso

- Redução do tempo para fechar orçamento (lead → projeto).
- Visibilidade do faturamento e do fluxo de caixa para a gestão.
- Rastreabilidade dos projetos por etapa de produção.

---

*Documento vivo; atualizar conforme o produto evolui.*
