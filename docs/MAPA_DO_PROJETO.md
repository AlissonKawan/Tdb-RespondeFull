# Mapa do Projeto — TDB Responde

Este documento existe para ajudar a controlar o projeto quando você for usar IA/Codex. A ideia não é decorar tudo, mas saber **onde cada tipo de mudança deve acontecer**.

---

## 1. Visão geral

O TDB Responde é um monorepo full stack dividido em partes principais:

```txt
Tdb-RespondeFull/
├── frontend/        # Interface web React + TypeScript + Vite + Tailwind
├── backend/         # API Java 21 + Quarkus + JDBC + Oracle
├── database/        # Scripts SQL principais do Oracle
├── IA-API/          # API Python de classificação/predição
├── cronograma-api/  # API auxiliar para cronograma
└── docs/            # Documentações do projeto
```

Fluxo geral:

```txt
Usuário na tela
   ↓
Página React
   ↓
Service do frontend
   ↓
Endpoint REST no backend Resource
   ↓
BO / regra de negócio
   ↓
DAO / acesso ao Oracle
   ↓
Banco de dados
```

Para mexer com segurança, tente sempre identificar em qual parte do fluxo o problema está.

---

## 2. Frontend

Local principal:

```txt
frontend/src/
```

### 2.1 Entrada e rotas

Arquivo principal:

```txt
frontend/src/App.tsx
```

Responsabilidade:

- define as rotas públicas e protegidas;
- carrega páginas com `React.lazy`;
- envolve a aplicação com `AuthProvider`;
- separa layout institucional e layout do sistema.

Rotas públicas principais:

```txt
/
/sobre
/faq
/contato
/integrantes
/roadmap
/login
/cadastro-voluntario
/cadastro-beneficiario
```

Rotas protegidas principais:

```txt
/admin
/portal/beneficiario
/portal/voluntario
/beneficiario/solicitar-atendimento
/atendimentos/:id
/inscricoes-pendentes
/ranking
/mensagens-contato
/agenda
/cronograma
```

Quando uma tela não aparece, dá erro de rota ou precisa de permissão, comece olhando:

```txt
frontend/src/App.tsx
frontend/src/components/ui/ProtectedRoute.tsx
frontend/src/context/AuthContext.tsx
```

---

### 2.2 Contexto de autenticação

Arquivos principais:

```txt
frontend/src/context/AuthContext.tsx
frontend/src/context/authContextInstance.ts
frontend/src/services/authService.ts
frontend/src/types/auth.ts
```

Responsabilidade:

- guardar o usuário logado;
- salvar/remover usuário no `localStorage`;
- expor `login`, `register` e `logout`;
- indicar papéis como `ADMIN`, `VOLUNTARIO` e `BENEFICIARIO`.

Quando o problema for login, usuário sumindo, permissão errada ou tela protegida bloqueando acesso, investigue essa área.

---

### 2.3 Configuração de API

Arquivo principal:

```txt
frontend/src/config/api.ts
```

Responsabilidade:

- definir a URL base do backend;
- definir a URL base da IA;
- usar `VITE_API_URL` quando existir;
- usar localhost em desenvolvimento.

Ponto de atenção:

```txt
API_BASE_URL
IA_API_BASE_URL
```

Quando o front não consegue conversar com o backend, comece por aqui e depois confira `.env`, Vercel/Render/Azure e CORS no backend.

---

### 2.4 Cliente HTTP central

Arquivo principal:

```txt
frontend/src/services/apiClient.ts
```

Responsabilidade:

- concentrar as chamadas `fetch`;
- montar URL com `API_BASE_URL`;
- tratar erro de API;
- converter resposta JSON;
- fornecer métodos `get`, `post`, `put`, `delete`.

Regra prática:

> Página não deve sair fazendo `fetch` solto se já existe service. O ideal é página chamar service, e service chamar `apiClient`.

---

### 2.5 Services do frontend

Pasta:

```txt
frontend/src/services/
```

Services importantes:

```txt
apiClient.ts              # cliente HTTP base
api.ts                    # camada/atalhos de API
authService.ts            # login/cadastro/autenticação
atendimentoService.ts     # atendimentos
mensagensService.ts       # mensagens/chat
voluntariosService.ts     # voluntários
usuarioService.ts         # usuários/contas
canaisService.ts          # canais de comunicação
especialidadesService.ts  # especialidades
prontuarioService.ts      # prontuário
agendaService.ts          # agenda/consultas
cronogramaService.ts      # cronograma
relatoAtendimentoService.ts # relato/solicitação de situação
iaService.ts              # chamadas para IA
contatoService.ts         # formulário/mensagens de contato
```

Quando uma tela precisa buscar/salvar dados, procure primeiro o service correspondente.

Exemplo mental:

```txt
Tela DetalheAtendimento
   ↓
atendimentoService / mensagensService
   ↓
apiClient
   ↓
Backend /atendimentos ou /mensagens
```

---

### 2.6 Páginas principais

Pasta:

```txt
frontend/src/pages/
```

Páginas de negócio:

```txt
Dashboardadmin.tsx
PortalBeneficiario.tsx
PortalVoluntario.tsx
SolicitarAtendimento.tsx
DetalheAtendimento.tsx
AprovacaoVoluntarios.tsx
RankingVoluntarios.tsx
MensagensContato.tsx
AgendaConsultas.tsx
Cronograma.tsx
CadastroVoluntario.tsx
CadastroBeneficiario.tsx
Login.tsx
```

Páginas institucionais:

```txt
Home.tsx
Sobre.tsx
FAQ.tsx
Contato.tsx
Integrantes.tsx
Roadmap.tsx
```

Regra prática:

> Página controla experiência do usuário. Regra de negócio pesada deve ficar no backend. Página deve orquestrar estado, formulário e chamada de service.

---

### 2.7 Componentes reutilizáveis

Pasta:

```txt
frontend/src/components/
```

Áreas comuns:

```txt
components/layout/    # Layout, NavBar, Footer, SystemLayout
components/ui/        # Card, ProtectedRoute, componentes visuais reutilizáveis
```

Quando a mudança for visual e aparece em várias telas, provavelmente é componente.

Quando a mudança for regra de acesso, veja `ProtectedRoute`.

---

## 3. Backend

Local principal:

```txt
backend/src/main/java/br/com/tdbresponde/
```

Camadas principais:

```txt
resource/   # endpoints REST e WebSocket
bo/         # regras de negócio
service/    # integrações/serviços auxiliares
client/     # clientes externos
config/     # configurações, seeds, integrações
security/   # senha/hash/autenticação
model/      # entidades/domínio
DTO/ dto/   # objetos de entrada e saída
DAO/ dao/   # acesso ao banco Oracle via JDBC
exception/  # exceções do sistema
```

Fluxo esperado no backend:

```txt
Resource recebe HTTP
   ↓
Request DTO representa entrada
   ↓
BO valida e aplica regra de negócio
   ↓
DAO executa SQL/JDBC
   ↓
Model representa dados internos
   ↓
Response DTO volta para o frontend
```

---

### 3.1 Configuração Quarkus/Maven

Arquivos principais:

```txt
backend/pom.xml
backend/src/main/resources/application.properties
backend/Dockerfile
```

Responsabilidade:

- `pom.xml`: dependências Java/Quarkus, Oracle JDBC, REST, WebSocket, testes e build;
- `application.properties`: porta, Oracle, CORS, IA, cronograma, validação CRO e Gemini;
- `Dockerfile`: empacotamento/deploy.

Tecnologias centrais:

```txt
Java 21
Quarkus 3.x
Maven
Oracle JDBC
REST Jackson
WebSocket
JSoup
JUnit/RestAssured/Mockito
```

---

### 3.2 Resources — entrada da API

Pasta:

```txt
backend/src/main/java/br/com/tdbresponde/resource/
```

Resources encontrados/importantes:

```txt
AtendimentoResource.java
MensagemResource.java
ChatWebSocket.java
AuthResource.java
VoluntarioResource.java
ContaUsuarioResource.java
CanalComunicacaoResource.java
EspecialidadeResource.java
ProntuarioResource.java
AgendaConsultaResource.java
CronogramaResource.java
ContatoResource.java
HealthResource.java
PingResource.java
SpaFallbackResource.java
```

Responsabilidade:

- expor endpoints REST;
- receber DTO de request;
- chamar BO;
- devolver DTO de response;
- não deveria conter regra de negócio pesada.

Exemplo de fluxo em atendimento:

```txt
GET /atendimentos
POST /atendimentos
GET /atendimentos/{id}
PUT /atendimentos/{id}/status-prioridade
PUT /atendimentos/{id}/assumir
PUT /atendimentos/{id}/checkin
GET /atendimentos/{id}/mensagens
POST /atendimentos/{id}/mensagens
```

---

### 3.3 BO — regra de negócio

Pasta:

```txt
backend/src/main/java/br/com/tdbresponde/bo/
```

BOs importantes:

```txt
AtendimentoBO.java
MensagemBO.java
ContaUsuarioBO.java
VoluntarioBO.java
CanalComunicacaoBO.java
EspecialidadeBO.java
ProntuarioBO.java
AgendaConsultaBO.java
CronogramaBO.java
ContatoBO.java
```

Responsabilidade:

- validar dados;
- aplicar regras;
- decidir status/prioridade;
- chamar DAO;
- chamar integrações externas quando fizer sentido;
- lançar `BusinessException` ou `NotFoundException`.

Regra mental:

> Se a pergunta for “pode ou não pode fazer isso?”, provavelmente a resposta deve estar no BO.

Exemplos reais no projeto:

```txt
AtendimentoBO
- listar atendimentos
- buscar por voluntário/beneficiário
- solicitar atendimento
- relatar situação
- assumir atendimento
- encerrar atendimento
- atualizar check-in
- calcular prioridade
- validar status
- registrar histórico de status ao encerrar

MensagemBO
- listar mensagens por atendimento
- validar envio
- impedir mensagem em atendimento encerrado/cancelado
- salvar mensagem
- disparar WebSocket
- chamar IA para classificar mensagem
```

---

### 3.4 DAO — banco de dados

Pasta:

```txt
backend/src/main/java/br/com/tdbresponde/dao/
```

DAOs importantes:

```txt
AtendimentoDAO.java
MensagemDAO.java
HistoricoStatusDAO.java
PessoaAtendidaDAO.java
CriancaAdolescenteDAO.java
MulherApoloniaDAO.java
VoluntarioDAO.java
CanalComunicacaoDAO.java
EspecialidadeDAO.java
ContaUsuarioDAO.java
ProntuarioDAO.java
AgendaConsultaDAO.java
ContatoDAO.java
DatabaseInitializer.java
```

Responsabilidade:

- abrir conexão;
- executar SQL;
- montar objetos `model` a partir do banco;
- inserir, atualizar, listar e excluir registros.

Regra prática:

> DAO não deve decidir regra de negócio. DAO deve saber conversar com o banco.

Se o problema for SQL, campo vindo nulo, join errado, insert falhando ou dado não persistindo, comece pelo DAO.

---

### 3.5 Models — domínio

Pasta:

```txt
backend/src/main/java/br/com/tdbresponde/model/
```

Entidades importantes:

```txt
Atendimento
Mensagem
PessoaAtendida
PessoaAtendidaBase
CriancaAdolescente
MulherApolonia
Voluntario
CanalComunicacao
Especialidade
HistoricoStatus
MensagemContato
```

Responsabilidade:

- representar o mundo do sistema em objetos Java;
- carregar atributos como id, status, prioridade, pessoa, voluntário, datas etc.

Regra prática:

> Model não deveria conhecer HTTP, tela, JSON de resposta ou SQL complexo.

---

### 3.6 DTOs — entrada e saída da API

Pasta:

```txt
backend/src/main/java/br/com/tdbresponde/dto/
```

Exemplos importantes:

```txt
AtendimentoRequest
AtendimentoResponse
AtendimentoAtualizacaoRequest
AssumirAtendimentoRequest
CheckinRequest
CheckinPrevisaoResponse
EncerrarAtendimentoRequest
MensagemRequest
MensagemResponse
PredictRequest
PredictResponse
RelatarSituacaoRequest
RelatarSituacaoResponse
AuthUserResponse
```

Responsabilidade:

- proteger o backend de receber/devolver model diretamente;
- organizar dados que entram e saem da API;
- transformar model em resposta para o frontend.

Regra prática:

> Se o frontend precisa de um campo novo na resposta, provavelmente você mexe no Response DTO e no Resource/BO/DAO conforme necessário.

---

## 4. Banco de dados

Pasta principal:

```txt
database/
```

Arquivos principais:

```txt
01_drop_tables.sql
02_create_tables.sql
03_insert_data.sql
README.md
```

Scripts SQL extras no backend:

```txt
backend/src/main/resources/sql/
```

Tabelas centrais:

```txt
T_CONTA_USUARIO
VOLUNTARIO
PESSOA_ATENDIDA
CRIANCA_ADOLESCENTE
MULHER_APOLONIA
CANAL_COMUNICACAO
ESPECIALIDADE
ATENDIMENTO
MENSAGEM
MENSAGEM_CANAL
HISTORICO_STATUS
VOLUNTARIO_ESPECIALIDADE
```

Relação mental:

```txt
T_CONTA_USUARIO
   ├── VOLUNTARIO
   └── PESSOA_ATENDIDA
          ├── CRIANCA_ADOLESCENTE
          └── MULHER_APOLONIA

PESSOA_ATENDIDA + VOLUNTARIO + CANAL_COMUNICACAO
   ↓
ATENDIMENTO
   ├── MENSAGEM
   └── HISTORICO_STATUS
```

---

## 5. Chat e mensagens

Fluxo principal:

```txt
DetalheAtendimento.tsx / tela de chat
   ↓
mensagensService.ts ou atendimentoService.ts
   ↓
POST /atendimentos/{id}/mensagens
ou POST /mensagens
   ↓
MensagemResource
   ↓
MensagemBO.inserir
   ↓
MensagemDAO.inserir
   ↓
ChatWebSocket.broadcastText
   ↓
clientes conectados em /chat/{atendimentoId}/{usuarioId}
```

Arquivos para investigar quando o chat não atualiza:

```txt
frontend/src/pages/DetalheAtendimento.tsx
frontend/src/services/mensagensService.ts
frontend/src/services/atendimentoService.ts
backend/src/main/java/br/com/tdbresponde/resource/MensagemResource.java
backend/src/main/java/br/com/tdbresponde/resource/AtendimentoResource.java
backend/src/main/java/br/com/tdbresponde/bo/MensagemBO.java
backend/src/main/java/br/com/tdbresponde/resource/ChatWebSocket.java
backend/src/main/java/br/com/tdbresponde/dao/MensagemDAO.java
```

Perguntas para guiar debug:

```txt
1. A mensagem salva no banco?
2. O endpoint retorna 201?
3. O frontend está conectado ao WebSocket correto?
4. O backend mostra sala ativa no log?
5. O broadcast está sendo chamado?
6. O frontend escuta o evento e atualiza o estado da lista?
```

---

## 6. IA e integrações externas

### 6.1 IA de mensagem/check-in

Locais principais:

```txt
IA-API/
backend/src/main/java/br/com/tdbresponde/service/ClassificadorService.java
backend/src/main/java/br/com/tdbresponde/config/IaClient.java
backend/src/main/java/br/com/tdbresponde/dto/PredictRequest.java
backend/src/main/java/br/com/tdbresponde/dto/PredictResponse.java
frontend/src/services/iaService.ts
```

Configuração:

```txt
IA_API_URL
VITE_IA_API_URL
ia.api.url
classificador-api/mp-rest/url
```

Fluxos:

```txt
Mensagem enviada
   ↓
MensagemBO.classificarMensagem
   ↓
ClassificadorService / IA Python
   ↓
PredictResponse com categoria/confianca
```

```txt
Check-in atualizado
   ↓
AtendimentoBO.atualizarCheckinComPrevisao
   ↓
IaClient.preverCheckin
   ↓
CheckinPrevisaoResponse
```

---

### 6.2 Cronograma

Locais principais:

```txt
cronograma-api/
backend/src/main/java/br/com/tdbresponde/resource/CronogramaResource.java
backend/src/main/java/br/com/tdbresponde/bo/CronogramaBO.java
backend/src/main/java/br/com/tdbresponde/client/CronogramaRestClient.java
frontend/src/pages/Cronograma.tsx
frontend/src/services/cronogramaService.ts
```

Configuração:

```txt
CRONOGRAMA_API_URL
cronograma-api/mp-rest/url
```

---

### 6.3 Validação de CRO

Locais principais:

```txt
backend/src/main/java/br/com/tdbresponde/client/GovCroVerificationService.java
backend/src/main/resources/application.properties
```

Configurações:

```txt
tdbresponde.cro.verification.mode
tdbresponde.cro.verification.url
tdbresponde.cro.verification.strict
```

---

## 7. Fluxos de negócio principais

### 7.1 Login

```txt
Login.tsx
   ↓
authService.ts
   ↓
AuthResource.java
   ↓
ContaUsuarioBO.java
   ↓
ContaUsuarioDAO.java
   ↓
T_CONTA_USUARIO
   ↓
AuthContext.tsx salva usuário no localStorage
```

Arquivos para mexer:

```txt
frontend/src/pages/Login.tsx
frontend/src/services/authService.ts
frontend/src/context/AuthContext.tsx
backend/src/main/java/br/com/tdbresponde/resource/AuthResource.java
backend/src/main/java/br/com/tdbresponde/bo/ContaUsuarioBO.java
backend/src/main/java/br/com/tdbresponde/dao/ContaUsuarioDAO.java
backend/src/main/java/br/com/tdbresponde/security/SenhaHasher.java
```

---

### 7.2 Cadastro/aprovação de voluntário

```txt
CadastroVoluntario.tsx
   ↓
voluntariosService.ts / authService.ts
   ↓
VoluntarioResource.java / AuthResource.java
   ↓
VoluntarioBO.java / ContaUsuarioBO.java
   ↓
VoluntarioDAO.java / ContaUsuarioDAO.java
   ↓
VOLUNTARIO + T_CONTA_USUARIO
```

Arquivos para mexer:

```txt
frontend/src/pages/CadastroVoluntario.tsx
frontend/src/pages/AprovacaoVoluntarios.tsx
frontend/src/services/voluntariosService.ts
backend/src/main/java/br/com/tdbresponde/resource/VoluntarioResource.java
backend/src/main/java/br/com/tdbresponde/bo/VoluntarioBO.java
backend/src/main/java/br/com/tdbresponde/dao/VoluntarioDAO.java
```

---

### 7.3 Solicitação/relato de atendimento

```txt
SolicitarAtendimento.tsx
   ↓
atendimentoService.ts / relatoAtendimentoService.ts
   ↓
AtendimentoResource.java
   ↓
AtendimentoBO.java
   ↓
PessoaAtendidaDAO / CriancaAdolescenteDAO / MulherApoloniaDAO / AtendimentoDAO
   ↓
PESSOA_ATENDIDA + CRIANCA_ADOLESCENTE ou MULHER_APOLONIA + ATENDIMENTO
```

Arquivos para mexer:

```txt
frontend/src/pages/SolicitarAtendimento.tsx
frontend/src/services/atendimentoService.ts
frontend/src/services/relatoAtendimentoService.ts
backend/src/main/java/br/com/tdbresponde/resource/AtendimentoResource.java
backend/src/main/java/br/com/tdbresponde/bo/AtendimentoBO.java
backend/src/main/java/br/com/tdbresponde/dao/AtendimentoDAO.java
backend/src/main/java/br/com/tdbresponde/dao/PessoaAtendidaDAO.java
```

---

### 7.4 Assumir atendimento

```txt
PortalVoluntario.tsx ou Dashboardadmin.tsx
   ↓
atendimentoService.assumirAtendimento
   ↓
PUT /atendimentos/{id}/assumir
   ↓
AtendimentoResource.assumir
   ↓
AtendimentoBO.assumir
   ↓
VoluntarioDAO.buscarPorId
   ↓
AtendimentoDAO.atualizar
```

Regras atuais:

```txt
- voluntarioId é obrigatório
- voluntário precisa existir
- voluntário precisa estar disponível
- atendimento não pode já ter voluntário responsável
- status muda para EM_ATENDIMENTO
```

---

### 7.5 Encerrar atendimento e histórico

```txt
Tela de detalhe/admin
   ↓
endpoint de encerrar/status
   ↓
AtendimentoResource
   ↓
AtendimentoBO.encerrar / atualizarStatusPrioridade
   ↓
AtendimentoDAO.atualizar
   ↓
HistoricoStatusDAO.inserir quando usa encerrarAtendimento
   ↓
ATENDIMENTO + HISTORICO_STATUS
```

Ponto de atenção:

- `encerrarAtendimento` registra histórico;
- `atualizarStatusPrioridade` atualiza status, mas precisa conferir se sempre deve registrar histórico também.

---

### 7.6 Prontuário

```txt
DetalheAtendimento.tsx / tela clínica
   ↓
prontuarioService.ts
   ↓
ProntuarioResource.java
   ↓
ProntuarioBO.java
   ↓
ProntuarioDAO.java
   ↓
PRONTUARIO
```

Arquivos para mexer:

```txt
frontend/src/services/prontuarioService.ts
backend/src/main/java/br/com/tdbresponde/resource/ProntuarioResource.java
backend/src/main/java/br/com/tdbresponde/bo/ProntuarioBO.java
backend/src/main/java/br/com/tdbresponde/dao/ProntuarioDAO.java
backend/src/main/resources/sql/prontuario.sql
```

---

## 8. Como pedir mudanças ao Codex sem perder controle

Use este padrão:

```txt
Analise apenas a funcionalidade [NOME].
Não altere código ainda.

Quero que você me diga:
1. quais arquivos participam desse fluxo;
2. qual é a responsabilidade de cada arquivo;
3. onde provavelmente está o problema;
4. qual seria o plano de alteração em passos pequenos;
5. quais testes manuais eu devo fazer depois.

Depois eu aprovo o plano antes de você alterar qualquer arquivo.
```

Quando for autorizar alteração:

```txt
Implemente apenas o passo [X] do plano.
Não refatore outras áreas.
Não altere nomes de classes, rotas ou estrutura sem me avisar.
Depois explique exatamente o que mudou e como testar.
```

---

## 9. Checklist antes de mexer em qualquer funcionalidade

Antes de pedir para a IA alterar algo, responda:

```txt
1. Qual tela ou endpoint está com problema?
2. O problema é visual, regra de negócio, integração ou banco?
3. Qual arquivo é a entrada do fluxo?
4. Qual service do frontend chama a API?
5. Qual Resource recebe essa chamada?
6. Qual BO aplica a regra?
7. Qual DAO mexe no banco?
8. Qual tabela é afetada?
9. Como vou testar que funcionou?
10. O que não pode quebrar?
```

Se você não souber responder todos, peça primeiro para o Codex mapear, não implementar.

---

## 10. Áreas de atenção técnica

### 10.1 Status e prioridade

Existem validações de prioridade e status em lugares diferentes. Antes de alterar status/prioridade, confira:

```txt
AtendimentoBO.java
AtendimentoDAO.java
AtendimentoRequest/Response
AtendimentoAtualizacaoRequest
CHECK constraints da tabela ATENDIMENTO
```

Ponto sensível:

```txt
Banco aceita status: ABERTO, EM_ATENDIMENTO, ENCERRADO, CANCELADO
```

Evite criar status novo sem alterar banco, backend e frontend juntos.

---

### 10.2 Datas e horários

Arquivos importantes:

```txt
backend/src/main/java/br/com/tdbresponde/config/TimezoneConfig.java
backend/src/main/java/br/com/tdbresponde/bo/MensagemBO.java
backend/src/main/java/br/com/tdbresponde/dao/MensagemDAO.java
backend/src/main/java/br/com/tdbresponde/dto/MensagemResponse.java
frontend/src/pages/DetalheAtendimento.tsx
```

Ponto sensível:

- backend usa `LocalDate`, `LocalDateTime` e Oracle `DATE/TIMESTAMP`;
- frontend precisa formatar data/hora corretamente;
- se horário estiver errado, investigue timezone, serialização JSON e conversão no front.

---

### 10.3 CORS e URLs de ambiente

Arquivos importantes:

```txt
frontend/src/config/api.ts
frontend/.env.example
backend/src/main/resources/application.properties
```

Pontos sensíveis:

```txt
VITE_API_URL
VITE_IA_API_URL
DB_URL
DB_USERNAME
DB_PASSWORD
CORS_ORIGINS
IA_API_URL
CRONOGRAMA_API_URL
```

---

### 10.4 Duplicidade de endpoint de mensagens

Existem dois caminhos relacionados a mensagem:

```txt
POST /mensagens
POST /atendimentos/{id}/mensagens
```

Antes de alterar chat/mensagem, confira qual deles o frontend usa.

---

## 11. Ordem sugerida para retomar controle do projeto

1. Corrigir e dominar o fluxo de mensagens/chat.
2. Corrigir horários de mensagens/atendimentos.
3. Padronizar status e prioridade.
4. Garantir histórico de status em toda mudança importante.
5. Revisar autenticação e permissões.
6. Criar testes mínimos para BOs principais.
7. Só depois refatorar organização interna.

---

## 12. Frase-guia do projeto

> O frontend mostra e chama. O Resource recebe. O BO decide. O DAO salva. O banco garante consistência.

Se uma mudança fugir muito disso, pare e pense antes de deixar a IA continuar.
