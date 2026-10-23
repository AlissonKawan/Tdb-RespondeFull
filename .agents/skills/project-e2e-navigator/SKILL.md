---
name: project-e2e-navigator
description: >-
  Navega por todo o projeto TDB Responde Full, testa todas as telas, clica nos botões,
  executa o fluxo completo de ponta a ponta (criar beneficiário, criar e aprovar voluntário,
  criar atendimento, assumir atendimento, enviar mensagens no chat, agendar consulta,
  encerrar e depois apagar os registros de teste) e valida se todas as requisições da API
  e regras de UX estão funcionando perfeitamente. Use esta skill sempre que o usuário pedir
  para testar tudo do projeto, navegar pelas páginas, validar fluxos completos ou verificar
  se o sistema está de acordo.
---

# Project E2E Navigator — Auditoria e Navegação Ponta a Ponta (TDB Responde Full)

Esta skill executa uma bateria completa de navegação e validação ponta a ponta no projeto **TDB Responde Full**, garantindo que telas, botões, modais de confirmação (`ConfirmDialog`), formulários, chat e requisições de API estejam funcionando de acordo com as regras do [AGENTS.md](../../../AGENTS.md).

---

## O que esta Skill Valida

1. **Cadastro de Beneficiário (`/cadastro-beneficiario` -> `POST /auth/register`)**:
   - Preenchimento do formulário, alternância de visualização de senha, submissão e validação do payload `tipoUsuario: 'BENEFICIARIO'`.
2. **Cadastro de Voluntário (`/cadastro-voluntario` -> `POST /auth/register`)**:
   - Seleção de especialidade odontológica, preenchimento de CRO/UF, motivo do voluntariado e validação do payload `tipoUsuario: 'VOLUNTARIO'`.
3. **Painel Admin — Aprovação, Gestão e Exclusão (`/admin` -> `DashboardAdmin`)**:
   - Navegação por todas as abas (`Dashboard`, `Atendimentos`, `Voluntários`, `Beneficiários`, `Inscrições`).
   - Clique em **Aprovar** voluntário (`PUT /voluntarios/{id}/aprovar`) com modal de confirmação.
   - Clique em **Rejeitar/Excluir** voluntário (`DELETE /voluntarios/{id}`) com modal de confirmação.
   - Alteração de status de atendimento (`PUT /atendimentos/{id}/status-prioridade`) exigindo confirmação explícita ("de -> para").
4. **Solicitação de Atendimento pelo Beneficiário (`/beneficiario/solicitar-atendimento` -> `POST /atendimentos/relatar`)**:
   - Seleção do perfil (Criança/Adolescente ou Mulher Apolônia), preenchimento de dados, abertura do modal de confirmação e envio do relato.
5. **Portal do Voluntário (`/portal/voluntario` -> `PUT /atendimentos/{id}/assumir`)**:
   - Navegação entre filas (`Atendimentos solicitados` e `Meus atendimentos`), filtros (`Todos`, `Urgentes`, `Casos Apolônia`), geração/cópia de link de indicação e clique em **Assumir atendimento** com modal de confirmação.
6. **Chat, Mensagens, Agenda, Prontuário e Encerramento (`/atendimentos/:id` -> `DetalheAtendimento`)**:
   - Envio de mensagem no chat (`POST /atendimentos/{id}/mensagens`) e deduplicação WebSocket.
   - Agendamento de consulta vinculada (`POST /agendas`) e registro de evolução clínica (`POST /prontuarios`).
   - Alteração de status para **Encerrado** com confirmação (`ConfirmDialog`) e bloqueio posterior do chat.
7. **Limpeza / Exclusão (`Teardown`)**:
   - Exclusão da consulta agendada (`DELETE /agendas/{id}`), exclusão do atendimento e suas mensagens/histórico em cascata (`DELETE /atendimentos/{id}`), exclusão do voluntário temporário (`DELETE /voluntarios/{id}`) e desativação de conta (`DELETE /usuarios/{id}`).

---

## Passo a Passo de Execução para o Agente

### Etapa 1: Executar a Navegação E2E de Interface e Requisições (Front-end DOM)

Este teste monta as páginas reais do React, clica nos botões, confirma os diálogos e intercepta/valida as requisições HTTP sem sujar o banco de dados real:

```powershell
cd frontend
npx.cmd vitest run src/__tests__/ProjectNavigationE2E.test.tsx
```

Para validar toda a suíte do front-end + tipagem + lint em seguida:

```powershell
cd frontend
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

---

### Etapa 2: Validar os Testes Automatizados do Back-end (Quarkus)

Execute os testes unitários e de recursos do back-end:

```powershell
cd backend
.\mvnw.cmd test "-Dgemini.api.key=test-key"
```

---

### Etapa 3: Auditoria E2E na API Real com Limpeza Automática (`scripts/e2e-api-lifecycle.mjs`)

> [!CAUTION]
> **Regra Obrigatória do `AGENTS.md` (Item 2):** Nunca execute o modo `--execute` contra um banco de dados real/compartilhado sem **autorização explícita** do programador na conversa atual.

1. **Modo Seguro (`--dry-run` - somente leitura):**
   Verifica se o back-end está online em `http://localhost:8080` e testa endpoints de leitura (`GET /ping`, `GET /health`, `GET /especialidades`) sem alterar nenhum dado:
   ```powershell
   node .agents/skills/project-e2e-navigator/scripts/e2e-api-lifecycle.mjs --dry-run
   ```

2. **Modo Ciclo Completo (`--execute` - cria, testa tudo e apaga ao final):**
   Após autorização explícita do usuário e com o back-end Quarkus rodando, execute:
   ```powershell
   node .agents/skills/project-e2e-navigator/scripts/e2e-api-lifecycle.mjs --execute
   ```
   *Variáveis de ambiente opcionais:*
   - `API_BASE_URL` (padrão: `http://localhost:8080`)
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD` (credenciais de um administrador ativo para testar aprovação de voluntário e exclusões restritas a admin).

---

### Etapa 4: Relatório de Saúde do Projeto

Ao concluir a execução desta skill, apresente ao usuário um resumo estruturado contendo:
- **Páginas e Fluxos Navegados:** Status (`OK` / `FALHA`) de cada jornada (Beneficiário, Voluntário, Admin, Atendimento, Chat, Agenda, Prontuário e Exclusão).
- **Requisições Validadas:** Confirmação de que os payloads e endpoints (`POST`, `PUT`, `GET`, `DELETE`) responderam conforme esperado.
- **Conformidade UX (`AGENTS.md` Regras 7 e 8):** Confirmação de que nenhum enum cru (`EM_ATENDIMENTO`, `ABERTO`, etc.) ou ID técnico vazou na UI e que os modais de confirmação funcionaram.
