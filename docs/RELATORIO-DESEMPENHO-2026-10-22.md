# Relatório de desempenho — TDB Responde

Data: 22/10/2026. Escopo: abertura do atendimento, mensagens, portal do voluntário,
leituras HTTP compartilhadas e consultas relacionadas. Implementação solicitada
pelo programador após a revisão. Orientações: `AGENTS.md` da raiz,
`java-spring-database-expert` e boas práticas React aplicáveis.

## Resultado e limites

Foram removidas buscas de históricos pelo portal, limitada a carga inicial do chat,
reduzidas leituras simultâneas duplicadas, antecipado o carregamento de filas
independentes e restringida a consulta geral de atendimentos conforme o usuário.
As mídias passam a ser baixadas quando próximas da área visível.

Estas mudanças reduzem trabalho demonstrável no código. Não houve benchmark de
latência em ambiente de produção ou conexão com Oracle real para validar os novos
planos. Não se afirma que todos os endpoints ficaram instantâneos, nem que o SQL
foi validado por execução em Oracle. Os testes JDBC usam mocks.

Arquitetura observada: Java 21 como alvo de compilação, Quarkus 3.17.8,
REST/Jackson, BOs e DAOs JDBC/Oracle, pool Agroal, React 18 e Vite.
Nenhum framework ou dependência foi adicionado.

## Achados priorizados e mudanças aplicadas

### 1. Média — histórico completo por card do portal

**Evidência:** `PortalVoluntario.carregarMeus` chamava
`getMensagensAtendimento` uma vez por atendimento para descobrir o remetente da
última mensagem. Isso multiplicava chamadas autenticadas, consultas e conteúdo
transferido; o custo crescia com a quantidade de casos e mensagens.

**Aplicado:** a consulta já autorizada por voluntário retorna o remetente mais
recente, resumido no booleano `ultimaMensagemDoBeneficiario`. A agregação Oracle
usa data e ID como desempate. O portal calcula o badge com esse booleano e não
busca nenhuma conversa para montar a lista. O campo fica ausente nas demais
respostas que não calculam esse resumo.

**Regra preservada:** o badge indica que a última mensagem veio do beneficiário.
Ele não representa uma contagem real de mensagens não lidas; não foi inventada
uma regra de leitura. O resumo é calculado somente na listagem por voluntário,
que continua exigindo o próprio vínculo ou perfil administrador.

**Verificação:** teste do portal mantém o badge e a ordenação sem chamar o serviço
de mensagens. Teste JDBC verifica uma consulta, parâmetro do voluntário e resumo
para remetente beneficiário, equipe e conversa vazia.

### 2. Média — carga inicial proporcional a todo o histórico

**Evidência:** o GET de mensagens carregava todas as mensagens, e cada anexo
montado disparava imediatamente um download autenticado.

**Aplicado:** a mesma rota aceita `limite` entre 1 e 100 e `antesId` opcional.
A tela solicita 50 mensagens recentes e carrega as anteriores ao rolar para o
início, mantendo a posição de leitura. A ordenação é cronológica, com desempate
por ID. A referência de cursor é resolvida dentro do mesmo atendimento.

O limite é aplicado aos IDs das mensagens antes dos JOINs de canais; assim,
vários canais não consomem posições da página. Na resposta paginada há uma
ocorrência por mensagem e, se houver vários canais legados, é escolhido o de
menor ID. O modelo e o DTO continuam expondo um único canal.

`IntersectionObserver` adia downloads até 300px da área visível do histórico.
Navegadores sem essa API mantêm o download imediato como compatibilidade.
Autenticação, Blob, Object URL, liberação da URL e visualizador foram preservados.

**Contrato preservado:** sem parâmetros, a rota continua retornando o histórico
completo em um array. O contador da tela reflete as mensagens carregadas. Uma
página com exatamente 50 mensagens pode provocar uma última busca vazia ao chegar
ao início; isso evita adicionar contagem total de banco à abertura da conversa.

**Falhas e concorrência:** uma falha de página mantém as mensagens e permite nova
tentativa ao rolar; páginas simultâneas são bloqueadas. Respostas de uma carga
anterior são ignoradas após troca de atendimento/conta ou desmontagem. Mensagens
recebidas pelo WebSocket durante a paginação são preservadas sem duplicação.

**Verificação:** testes de limite inválido, cursor, autorização cruzada, fechamento
de recursos, erros JDBC, manutenção do formato HTTP, bloqueio de chamadas
simultâneas, preservação da âncora, chegada pelo socket e anexo fora da área visível.

### 3. Média — requisições GET equivalentes sem reaproveitamento em andamento

**Evidência:** o cliente acrescentava `t=Date.now()` a todo GET e não compartilhava
leituras idênticas simultâneas.

**Aplicado:** URLs estáveis e compartilhamento apenas de requisições em andamento
na mesma sessão. Após a conclusão ou falha, a próxima leitura volta ao servidor.
Troca de token e escritas limpam os vínculos pendentes. Cada consumidor recebe
uma cópia independente dos dados para poder ordenar sua lista. Chamadas com
opções específicas, como cancelamento e headers, permanecem independentes.
O mapa é limitado a 100 entradas; ao atingir o limite, as chamadas seguem sem
compartilhamento.

**Decisão de consistência:** foi mantido `cache: no-store`. Remover o timestamp
não foi apresentado como cache persistente. Não foi introduzida retenção de
mensagens, prontuários ou decisões de autorização entre requisições concluídas.
Isso mantém a revalidação no servidor e evita criar uma janela de permissão
obsoleta. Um cache de respostas para reabertura imediata exige política explícita
de validade, invalidação e revogação; permanece como etapa posterior.

**Verificação:** dois GETs simultâneos geram um fetch; respostas posteriores
continuam novas; objetos não são compartilhados por referência; sessões,
escritas, falhas e sinais de cancelamento têm testes.

### 4. Média — materialização de atendimentos alheios antes da filtragem

**Evidência:** a rota geral consultava toda a tabela e depois filtrava a lista
em Java. A consulta base também calcula a data da última mensagem por atendimento.

**Aplicado:** a política de acesso escolhe uma consulta restrita. Para voluntário,
o SQL considera os próprios casos e a fila aberta sem responsável. Para
beneficiário, a política usa a consulta pela conta autenticada; o filtro HTTP
existente continua restringindo a rota geral à equipe. Administradores continuam
com a listagem completa. A verificação por objeto permanece após o SQL.
Conta de voluntário sem vínculo não usa o ID da conta como ID de voluntário.

**Verificação:** testes confirmam os parâmetros, o caso sem vínculo, a consulta
administrativa e a rejeição de um registro alheio mesmo se retornado pelo BO mock.

### 5. Baixa — SELECT genérico em agenda e prontuário

**Evidência:** a suíte completa apontou uma falha preexistente em
`SQLOptimizationTest`, por consultas `SELECT *` nesses DAOs, que participam da
abertura do atendimento.

**Aplicado:** projeções explícitas contendo todos os campos usados pelos
mapeadores, com os mesmos filtros, vínculos, ordenação e tratamento de nulos.
Não se promete redução de latência se essas já eram todas as colunas das tabelas;
o benefício é estabilizar a projeção e evitar transferir futuras colunas extras.

**Verificação:** testes existentes dos DAOs e verificação arquitetural de SQL.

## Redução de trabalho: antes e depois

Os números abaixo descrevem quantidade de operações e limites do código, não
tempos de produção:

- Portal com N atendimentos: antes, 1 GET da lista mais N GETs de histórico; agora,
  1 GET da lista, incluindo os indicadores. Exemplo calculado com 30 casos:
  31 chamadas passam a 1 nessa operação, sem contar fila e perfil independentes.
- Primeira abertura de uma conversa com H mensagens: antes, H mensagens; agora,
  no máximo 50 mensagens únicas. Com 1.000 mensagens, o limite inicial representa
  95% menos mensagens; esse exemplo é calculado, não um benchmark executado.
- Duas leituras simultâneas equivalentes sem opções próprias: 2 fetches passam
  a 1, comprovado pelo teste do cliente. A otimização não vale entre sessões.
- Filas do portal: a busca dos próprios atendimentos e do perfil não precisa
  aguardar o retorno da fila de solicitados, comprovado com uma promessa pendente.
- Anexo fora da área observada: nenhum download antes da interseção, comprovado
  pelo teste; o fallback sem IntersectionObserver continua imediato.

Atendimento e mensagens já carregavam em paralelo antes desta intervenção.
WebSocket, confirmação de alterações, status, prioridade e regras clínicas não
foram substituídos.

Na publicação, disponibilizar o backend antes do frontend ou publicar ambos
juntos: o indicador de última mensagem depende do novo campo da listagem.
Consumidores antigos continuam funcionando com o backend atualizado.
Na reconexão do WebSocket, foi preservada a ressincronização completa existente;
ela ainda pode transferir um histórico grande e não recebe o limite inicial de 50.

## Banco: proposta não executada

Nenhum schema, dado, índice ou configuração de produção foi alterado.
O arquivo [proposta-indice-mensagens.sql](sql/proposta-indice-mensagens.sql)
contém consultas de metadados e uma proposta de índice comentada:
`MENSAGEM(ATENDIMENTO_ID, DATA_HORA, ID)`.

A ausência desse índice nos arquivos não prova sua ausência no banco. O responsável
deve confirmar índices equivalentes e planos, custo de escrita, espaço e locks.
Criação/remoção dependem de autorização explícita para o ambiente e operação.
DDL Oracle pode efetuar commit implícito; rollback transacional não o desfaz.

Foram encontrados inicializadores de schema preexistentes, inclusive em
`MensagemDAO`, controlados por configuração. Não foram ativados nem expandidos.
A execução dos testes desativou esses inicializadores; a remoção operacional dos
legados exige uma intervenção própria para conferir dependências do schema.

## Medições ainda necessárias

Em homologação isolada, com dados sintéticos de volume e distribuição equivalentes:

1. Registrar clique até primeira mensagem visível, TTFB, bytes transferidos,
   quantidade de requisições e mensagens renderizadas.
2. Medir p50 e p95 por endpoint, separando primeira abertura e navegação repetida,
   com aquecimento documentado e as mesmas condições de rede/concorrência.
3. Medir tempo de SQL, linhas lidas e espera/aquisição de conexões Agroal.
4. Executar as consultas novas no Oracle real da homologação, verificar planos,
   nulos legados, canais múltiplos, horários iguais e cursor de outro atendimento.
5. Comparar antes/depois com o mesmo conjunto de dados e carga.

O pool, a hospedagem, cold starts e distância entre API e banco podem continuar
limitando a latência. Não foram aumentadas conexões nem alteradas configurações
sem evidência de saturação. Agenda, prontuário e outras listagens continuam sem
paginação geral: mudar os contratos de todas as telas requer avaliação dos seus
consumidores e dos controles de navegação.

## Arquivos envolvidos

- Backend de atendimento: `AtendimentoDAO`, `AtendimentoBO`, `AtendimentoAccess`,
  `Atendimento`, `AtendimentoResponse` e `AtendimentoResource`.
- Backend de mensagens: `MensagemDAO` e `MensagemBO`.
- Consultas relacionadas: `AgendaConsultaDAO` e `ProntuarioDAO`.
- Frontend: `PortalVoluntario.tsx`, `DetalheAtendimento.tsx`, `apiClient.ts`,
  `mensagensService.ts` e `AtendimentoApi.ts`.
- Testes: paginação de mensagens em BO/DAO, desempenho das consultas de atendimento,
  autorização/contrato HTTP, cliente HTTP, portal, conversa e serviço de mensagens.

## Validação executada

- Antes das mudanças: 25 testes direcionados do backend e 27 do frontend passaram.
- Frontend: suíte completa com **151 testes em 26 arquivos passou**. Após o último
  ajuste de limpeza do erro de paginação, os **29 testes das duas páginas afetadas
  passaram novamente**. Build TypeScript/Vite e ESLint dos arquivos alterados passaram.
- Backend: seleção ampla isolada com **181 testes executados: 180 passaram e 1
  falhou**, sem erros de inicialização na última execução. Inclui os novos testes
  JDBC, BO, autorização e o teste HTTP de paginação, que passaram.
- A única falha restante foi `AuthenticationHttpTest.loginMeLogoutAndRevocation`:
  o POST de logout recebeu HTTP 500 em vez de 204. A mesma falha foi reproduzida
  executando apenas esse teste em uma cópia temporária do HEAD `5996e08`, anterior às
  otimizações, confirmando que é preexistente. O código de logout não foi alterado;
  sua causa específica permanece pendente de diagnóstico.
- Foram excluídos da seleção ampla o teste opt-in de escrita no Oracle real
  (`CronogramaOracleIntegrationTest`) e a consulta ao site externo de CRO
  (`GovCroVerificationServiceTest#testRealUrlContent`). Os demais testes dessa
  classe continuaram na seleção. Essas exclusões não alteram os arquivos de teste.
- O teste arquitetural de SQL, que falhava inicialmente por `SELECT *` em agenda,
  passou após as projeções explícitas. Testes de mapeamento desses DAOs passaram.
- `git diff --check` não apontou erros de whitespace.

O primeiro Vitest não executou testes devido a `EPERM` no cache temporário; a
execução fora desse isolamento passou. O Quarkus de teste inicialmente não abriu
o seletor de rede local. A validação final usou o JDK 21 já instalado e um
diretório curto de sockets, definido apenas no comando de teste. Também foi
fornecido um valor fictício para a configuração obrigatória da IA. Nenhum segredo
real foi usado e nenhuma configuração persistente da aplicação foi modificada.

Comando reproduzível da seleção ampla, em PowerShell dentro de `backend`:

```powershell
$env:JAVA_HOME='C:\Users\Administrator\.jdks\ms-21.0.8'
$env:TDB_ORACLE_VALIDATION='false'
.\mvnw.cmd `
  '-Dtest=*,!CronogramaOracleIntegrationTest,!GovCroVerificationServiceTest#testRealUrlContent' `
  '-DargLine=-Djdk.net.unixdomain.tmpdir=C:\Users\Administrator\Desktop\TDB-Responde\Tdb-RespondeFull' `
  '-Dgemini.api.key=isolated-test-placeholder' `
  '-Dtdb.schema.init.enabled=false' '-Dadmin.seed.enabled=false' `
  '-Dquarkus.datasource.jdbc.url=jdbc:oracle:thin:@127.0.0.1:1/isolated_test' `
  '-Dquarkus.datasource.jdbc.min-size=0' '-Dquarkus.datasource.jdbc.initial-size=0' test
```

No frontend: `npm.cmd test`, `npm.cmd run build` e ESLint direcionado aos arquivos
alterados. Não foi feita validação visual em navegador real, benchmark de carga,
deploy ou teste de persistência das consultas novas em Oracle. O ganho de tempo
de resposta permanece esperado; as reduções de trabalho e os contratos indicados
acima têm evidência de código e testes.

## Referências técnicas

- [Oracle: FIRST/LAST e KEEP](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/FIRST.html).
- [Oracle: ordenação em subconsulta antes de ROWNUM](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROWNUM-Pseudocolumn.html).

Essas referências documentam as construções SQL usadas; a versão e o plano do
servidor de banco do projeto não foram consultados nesta tarefa.
