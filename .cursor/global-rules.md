# Synkra AIOS - Regras para Cursor

**Como ativar no Cursor:** Copie o conteúdo deste arquivo em **Cursor → Settings → Rules → User Rules** para que o assistente reconheça os agentes e comandos AIOS.

Este projeto usa o **Synkra AIOS** (AI-Orchestrated System). Use estas regras no Cursor para integrar os agentes.

## Ativação dos agentes

- **Agentes disponíveis:** @dev, @qa, @architect, @pm, @po, @sm, @analyst, @data-engineer, @devops, @aios-master
- **Comandos** usam o prefixo `*`: *help, *create-story, *task, *exit
- As definições detalhadas de cada agente estão em `.cursor/rules/agents/` (sincronizadas pelo AIOS)

## Regras de desenvolvimento

1. **Histórias (quando existirem):** Trabalhe a partir de arquivos em `docs/stories/`; atualize checkboxes `[ ]` → `[x]` e mantenha a lista de arquivos alterados.
2. **Qualidade:** Siga os padrões do projeto; rode `npm run lint` e verifique tipos antes de concluir.
3. **Padrões:** Reutilize componentes e convenções já usados no código (Next.js, Prisma, etc.).

## Estrutura do AIOS neste projeto

- **Framework:** `.aios-core/` (core, agentes, tasks, templates)
- **Config:** `.aios-core/core-config.yaml` (tipo: brownfield)
- **Sync Cursor:** `npm run sync:ide:cursor` para atualizar `.cursor/rules/agents/`

## Comandos úteis

- `npx aios-core doctor` — diagnóstico da instalação AIOS
- `npm run sync:ide:cursor` — sincronizar agentes para o Cursor
- `*help` (com um agente ativo) — listar comandos do agente

---
*AIOS Cursor – sistema-camarpe (brownfield)*
