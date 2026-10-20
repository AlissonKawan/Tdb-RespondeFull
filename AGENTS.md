# AGENTS.md — Regras para agentes de desenvolvimento do TDB Responde Full

Este arquivo define regras obrigatórias para qualquer agente de IA que analise, implemente, corrija ou refatore o projeto **TDB Responde Full**. As instruções se aplicam ao front-end, back-end e banco de dados.

## 1. Validar o escopo antes de implementar

- Antes de implementar qualquer funcionalidade, confirmar se ela foi **realmente solicitada** pelo programador.
- Analisar os fluxos existentes e verificar se a mudança pode gerar conflitos, duplicidade, regressões ou alterar comportamentos já utilizados.
- Não adicionar funcionalidades, dependências, telas, endpoints ou alterações de arquitetura por iniciativa própria.
- Se houver ambiguidade sobre o objetivo ou risco relevante de conflito, apresentar o impacto e **solicitar esclarecimento ou autorização antes de implementar**.
- Limitar as alterações aos arquivos e comportamentos necessários para atender à solicitação.

## 2. Executar testes automatizados sempre

- Toda alteração de código deve ser acompanhada de **testes automatizados apropriados** à mudança.
- Antes de finalizar, executar os testes relacionados à área modificada e, quando viável, a suíte completa.
- Criar ou atualizar testes quando novos comportamentos forem introduzidos ou bugs corrigidos.
- No front-end, utilizar os testes e verificações já configurados no projeto (por exemplo, Vitest, ESLint e build TypeScript/Vite).
- No back-end, utilizar a infraestrutura de testes existente (por exemplo, JUnit, testes Quarkus e Maven).
- Nunca afirmar que os testes passaram sem tê-los executado. Se não for possível executar algum teste, informar **qual teste faltou, por quê e qual risco permanece**.
- Não executar testes de integração que alterem dados reais sem autorização explícita.

## 3. Preservar logo, identidade visual e estrutura das páginas

- Manter a **logo oficial**, suas proporções e sua aplicação visual, sem substituí-la ou modificá-la por conta própria.
- Preservar o layout, a hierarquia visual, a navegação e o **tipo de estrutura já adotado nas páginas**.
- Reutilizar os componentes, tokens de cor, tipografia, espaçamentos, bordas e padrões responsivos existentes.
- Não criar uma segunda identidade visual nem substituir o padrão atual por outro framework ou estilo.
- Não realizar mudanças estruturais de layout sem pedido e aprovação explícitos do programador.
- Uma alteração pontual não autoriza redesenhar páginas ou componentes não relacionados.

## 4. Nunca executar alterações automáticas no banco ao iniciar a aplicação

- **É proibido** criar, modificar, excluir, popular ou migrar automaticamente tabelas e dados durante a inicialização da aplicação.
- Não adicionar rotinas de startup, inicializadores, seeds, migrations automáticas ou configurações que executem DDL/DML ao subir o back-end.
- Se uma funcionalidade exigir mudança no banco, **interromper essa parte da implementação e avisar o programador antes**.
- Explicar quais tabelas/colunas/dados precisam mudar, a motivação, os impactos, os riscos e o procedimento SQL proposto.
- **Solicitar autorização explícita** antes de executar qualquer mudança de schema ou dados, inclusive em ambientes de desenvolvimento compartilhados.
- Entregar os scripts SQL para revisão e execução controlada pelo responsável. Não executá-los automaticamente nem executar scripts destrutivos sem aprovação específica.

## 5. Solicitar imagem de referência antes de alterar o front-end

- **Antes de qualquer alteração visual ou de estrutura no front-end**, solicitar ao programador uma **imagem de referência** da aparência desejada.
- Se uma imagem de referência já tiver sido fornecida para a tarefa, utilizá-la como referência e não solicitá-la novamente.
- Não presumir um novo estilo, uma nova distribuição de elementos ou um redesign com base apenas em preferências do agente.
- Caso não exista referência para uma alteração visual, **aguardar a referência e a definição do escopo antes de modificar a interface**.
- Implementar a referência respeitando a logo, o Design System e a estrutura existente; se houver conflito entre a referência e os padrões atuais, explicar o conflito e pedir decisão ao programador.
- Para mudanças exclusivamente internas de lógica no front-end, sem impacto visual, preservar a interface atual e confirmar o escopo técnico quando necessário.

## 6. Aplicar boas práticas de exceptions e tratamento de erros

- Utilizar as exceções e os mecanismos de tratamento de erros já estabelecidos no projeto; evitar criar padrões paralelos.
- Capturar exceções apenas quando for possível tratá-las corretamente, acrescentar contexto útil ou convertê-las em uma resposta adequada.
- **Nunca silenciar erros** com blocos `catch` vazios, retornos de sucesso falsos ou mensagens genéricas que ocultem a causa nos logs.
- Diferenciar erros de validação, autenticação/autorização, recurso não encontrado, conflito e erro interno, usando códigos HTTP coerentes.
- Exibir mensagens claras e seguras para o usuário, sem expor stack traces, SQL, tokens, senhas ou dados pessoais.
- Registrar informações suficientes para diagnóstico, sem incluir segredos ou dados sensíveis nos logs.
- No front-end, tratar estados de carregamento, falha e retorno vazio, evitando telas quebradas ou falhas silenciosas.
- Incluir testes automatizados para os cenários de erro relevantes, não apenas para o fluxo de sucesso.

## 7. Priorizar a experiência do usuário (UX) e nunca expor dados técnicos de banco/back-end na interface

- **É proibido exibir códigos, enums ou constantes cruas do banco de dados/back-end na interface**: valores técnicos como `EM_ATENDIMENTO`, `ENCERRADO`, `AGUARDANDO`, `CONCLUIDO`, `ABERTO`, `CRIANCA_ADOLESCENTE`, `MULHER_APOLONIA`, `AGUARDANDO_RESPOSTA`, entre outros, nunca devem aparecer diretamente em badges, selects, modais, tabelas, confirmações ou mensagens ao usuário.
- **Traduzir sempre para linguagem humana e amigável**: utilizar e manter funções utilitárias centralizadas (como em `src/utils/formatters.ts`) para converter qualquer status, tipo ou código interno em rótulos claros em português (por exemplo: `"Em andamento"`, `"Aguardando"`, `"Confirmado"`, `"Concluído"`, `"Encerrado"`).
- **Nunca exigir que o usuário escolha, digite ou interprete IDs de banco de dados**: é proibido criar ou manter campos visíveis de formulário que peçam IDs técnicos (como `"Atendimento Vinculado (ID)"`, `"Ex: 1001"`, `#163`) ou listar opções identificadas por chave primária (`#163 - Nome (EM_ATENDIMENTO)`). O `id` deve trafegar exclusivamente de forma interna no estado do componente e nos payloads da API.
- **Apresentar seletores e vínculos com contexto real do usuário**: em listas e campos de seleção (como ao selecionar um atendimento na agenda), exibir informações compreensíveis e úteis ao cliente/usuário — como **Nome do Paciente, Data, Horário e Tipo de Atendimento** (ex.: `Eduardo Boni — 20/10/2026 às 08:00 — Avaliação Inicial`) — preenchendo automaticamente os demais campos relacionados para facilitar o fluxo.
- **Pensar sempre na melhoria visual e na usabilidade do cliente/usuário**: organizar formulários e modais com hierarquia visual limpa, agrupamento semântico, ícones de apoio, estados visuais claros (como badges/pills com indicadores de cor) e rótulos intuitivos que melhorem a experiência de ponta a ponta.

## 8. Exigir confirmação explícita e detalhada em alterações e ações importantes

- **Toda alteração relevante deve pedir confirmação antes de ser salva**: qualquer edição ou ação importante em qualquer página do sistema — como editar uma consulta na agenda, reagendar/encerrar consulta, alterar status ou prioridade de atendimento, registrar evolução clínica, aprovar/rejeitar cadastros, editar dados de voluntários/beneficiários ou excluir registros — **deve exibir um modal de confirmação** antes de enviar a requisição ao back-end.
- **Explicitar exatamente o que está sendo alterado ("de -> para" ou resumo claro dos campos)**: a confirmação nunca deve ser genérica. Utilize o padrão do projeto (`useConfirm` / `ConfirmDialog` com a propriedade `details`) para mostrar de forma clara e amigável ao usuário **quais dados serão modificados** (ex.: Paciente, Data/Horário anterior vs. novo, Tipo de Atendimento, Status anterior vs. novo Status traduzido), perguntando explicitamente se ele deseja confirmar aquelas alterações.
- **Manter linguagem humana na confirmação**: todos os valores exibidos no resumo de confirmação (status, datas, horários, tipos) devem estar formatados em português claro (`dd/mm/aaaa`, `"Em andamento"`, `"Confirmado"`, etc.), nunca exibindo enums crus ou IDs técnicos.
- **Prevenir cliques acidentais**: bloquear submissões duplicadas enquanto a confirmação ou o salvamento estiver em andamento e permitir que o usuário cancele a confirmação voltando ao formulário sem perder os dados preenchidos.

## 9. Checklist obrigatório antes de concluir uma tarefa

- [ ] A funcionalidade foi solicitada e seu escopo está claro.
- [ ] Foi verificado se a mudança conflita com outros fluxos.
- [ ] A logo, o layout e a estrutura existentes foram preservados.
- [ ] Para mudança visual no front-end, existe imagem de referência aprovada.
- [ ] Nenhum enum, constante de banco (`EM_ATENDIMENTO`, etc.) ou ID técnico (`#123`, input de ID) está exposto ao usuário na interface.
- [ ] Seletores, formulários e modais priorizam a experiência visual do usuário com rótulos humanos e preenchimento inteligente.
- [ ] Alterações em consultas e demais ações importantes pedem confirmação explícita detalhando exatamente o que será modificado.
- [ ] Nenhum script ou alteração automática de banco foi introduzido na inicialização.
- [ ] Alterações de banco, quando necessárias, foram explicadas e autorizadas antes da execução.
- [ ] Exceptions e erros são tratados conforme os padrões existentes, sem expor dados sensíveis.
- [ ] Testes automatizados relevantes foram escritos/atualizados e executados, ou limitações foram relatadas.
- [ ] O resumo final informa arquivos alterados, testes executados, resultados e eventuais riscos pendentes.

