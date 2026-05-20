# Projeto TDB Responde

API REST desenvolvida em Java com Quarkus para gerenciar atendimentos, canais de comunicacao, especialidades e voluntarios do projeto TDB Responde.

O projeto foi organizado para a entrega da Sprint 4 mantendo as camadas exigidas de `Resource`, `BO`, `DAO` e `Model`, com persistencia via JDBC manual e conexao Oracle gerenciada pelo Quarkus.

## Publicacao No GitHub

Este repositorio esta preparado para publicacao sem credenciais reais.

- Nao versionar arquivos `.env`, `*.env`, `node_modules`, `target`, `dist` ou arquivos `.zip`.
- Configurar credenciais somente por variaveis de ambiente, nunca direto no codigo.
- Backend: usar `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD`.
- Frontend: usar `VITE_API_URL` e, se houver IA publicada, `VITE_IA_API_URL`.
- Os exemplos de SQL e README usam placeholders/dados demonstrativos.

## Tecnologias

- Java 21 LTS
- Quarkus 3.17.8
- Maven
- REST com Jackson
- CDI com Arc
- JDBC Oracle
- Oracle Database

## Arquitetura

```text
src/main/java/br/com/tdbresponde
  bo          Regras de negocio
  config      Configuracoes auxiliares do projeto
  dao         Acesso a dados com JDBC manual
  dto         Objetos de entrada e saida da API
  exception   Exceptions e mappers REST
  model       Entidades de dominio
  resource    Endpoints REST
```

O projeto nao utiliza JPA, Hibernate ou Panache nesta versao. Os DAOs continuam usando SQL manual, mas agora recebem `DataSource` por injecao CDI do Quarkus.

## Configuracao Do Banco

A conexao com Oracle e configurada em `backend/src/main/resources/application.properties`:

```properties
quarkus.http.host=0.0.0.0
quarkus.http.port=${PORT:8080}

quarkus.datasource.db-kind=oracle
quarkus.datasource.jdbc.url=${DB_URL:jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl}
quarkus.datasource.username=${DB_USERNAME:SEU_RM}
quarkus.datasource.password=${DB_PASSWORD:SUA_SENHA}

quarkus.datasource.jdbc.max-size=8
quarkus.datasource.jdbc.min-size=1
quarkus.datasource.jdbc.acquisition-timeout=10S
```

Antes de executar endpoints que acessam o banco, defina as variaveis de ambiente.

PowerShell:

```powershell
$env:DB_USERNAME="seu_usuario"
$env:DB_PASSWORD="sua_senha"
$env:DB_URL="jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl"
```

## Executando O Projeto

Use Java 21 LTS como Project SDK/JDK do Maven. Evite Java 26 para rodar localmente.

Com Maven instalado no PATH:

```powershell
mvn quarkus:dev
```

Caso esteja usando o Maven embutido do IntelliJ:

```powershell
& "C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.4\plugins\maven\lib\maven3\bin\mvn.cmd" quarkus:dev
```

A API ficara disponivel em:

```text
http://localhost:8080
```

Endpoint de verificacao:

```http
GET /ping
```

Resposta esperada:

```text
Projeto TDB Responde rodando no Quarkus
```

## Build

```powershell
mvn -DskipTests package
```

Com Maven do IntelliJ:

```powershell
& "C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.4\plugins\maven\lib\maven3\bin\mvn.cmd" -DskipTests package
```

## Endpoints

### Ping

```http
GET /ping
```

### Autenticacao

As contas de login ficam na tabela `T_CONTA_USUARIO`. A senha recebida no cadastro e armazenada como hash PBKDF2 com salt, nunca em texto puro.

```http
POST /auth/register
POST /auth/login
```

Cadastro:

```json
{
  "nome": "Dra. Ana",
  "email": "ana@example.com",
  "senha": "troque-esta-senha",
  "tipoUsuario": "VOLUNTARIO",
  "especialidadeId": 1,
  "motivoVoluntariado": "Quero contribuir com atendimento odontologico para pessoas que precisam."
}
```

Quando `tipoUsuario` for `VOLUNTARIO`, o cadastro cria uma solicitacao de voluntariado: a conta nasce inativa, o voluntario nasce com `statusAprovacao = PENDENTE`, `disponivel = false` e `acessoSigilo = false`. O voluntario so consegue entrar depois da aprovacao em `PUT /voluntarios/{id}/aprovar`.

Cadastro de beneficiario:

```json
{
  "nome": "Ana Beneficiaria",
  "email": "ana.beneficiaria@example.com",
  "senha": "troque-esta-senha",
  "tipoUsuario": "BENEFICIARIO",
  "telefone": "11999999999"
}
```

Quando `tipoUsuario` for `BENEFICIARIO`, a conta nasce ativa e o sistema cria ou vincula um registro em `pessoa_atendida` por `ID_CONTA`. Nao existe tabela `BENEFICIARIO`; o `beneficiarioId` retornado pela API representa `PESSOA_ATENDIDA.ID`.

Se `tipoPessoaAtendida` for enviado como `CRIANCA`/`CRIANCA_ADOLESCENTE` ou `MULHER`/`MULHER_APOLONIA`, o cadastro tambem cria o registro na tabela especifica correspondente.

Login:

```json
{
  "email": "ana@example.com",
  "senha": "troque-esta-senha"
}
```

Resposta de sucesso:

```json
{
  "id": 1,
  "nome": "Dra. Ana",
  "email": "ana@example.com",
  "tipoUsuario": "VOLUNTARIO",
  "ativo": true,
  "dataCriacao": "2026-05-11T20:30:00"
}
```

Codigos principais:

```text
400 dados invalidos
401 senha incorreta ou conta inativa
404 conta nao encontrada
409 email ja cadastrado
500 erro interno
```

### Usuarios

Endpoints administrativos simples para contas de login:

```http
GET    /usuarios
GET    /usuarios/{id}
PUT    /usuarios/{id}
DELETE /usuarios/{id}
```

`DELETE /usuarios/{id}` desativa a conta (`ATIVO = 0`) em vez de remover a linha.

Request de atualizacao:

```json
{
  "nome": "Dra. Ana Silva",
  "email": "ana.silva@example.com",
  "tipoUsuario": "VOLUNTARIO",
  "ativo": true
}
```

### Canais De Comunicacao

```http
GET    /canais
GET    /canais/{id}
POST   /canais
PUT    /canais/{id}
DELETE /canais/{id}
```

Request:

```json
{
  "nome": "WhatsApp",
  "descricao": "Canal de atendimento via WhatsApp"
}
```

Response:

```json
{
  "id": 1,
  "nome": "WhatsApp",
  "descricao": "Canal de atendimento via WhatsApp"
}
```

### Especialidades

```http
GET    /especialidades
GET    /especialidades/{id}
POST   /especialidades
PUT    /especialidades/{id}
DELETE /especialidades/{id}
```

Request:

```json
{
  "nome": "Odontologia",
  "descricao": "Atendimento odontologico infantil"
}
```

Response:

```json
{
  "id": 1,
  "nome": "Odontologia",
  "descricao": "Atendimento odontologico infantil"
}
```

### Voluntarios

```http
GET    /voluntarios
GET    /voluntarios/pendentes
GET    /voluntarios/{id}
POST   /voluntarios
PUT    /voluntarios/{id}
PUT    /voluntarios/{id}/aprovar
DELETE /voluntarios/{id}
```

Request:

```json
{
  "nome": "Dra. Ana",
  "usuario": "ana.odonto",
  "senha": "troque-esta-senha",
  "acessoSigilo": true,
  "disponivel": true,
  "motivoVoluntariado": "Quero ajudar pessoas que precisam de atendimento.",
  "especialidadeId": 1
}
```

Response:

```json
{
  "id": 1,
  "nome": "Dra. Ana",
  "usuario": "ana.odonto",
  "acessoSigilo": true,
  "disponivel": true,
  "statusAprovacao": "PENDENTE",
  "motivoVoluntariado": "Quero ajudar pessoas que precisam de atendimento.",
  "contaId": 1,
  "especialidade": {
    "id": 1,
    "nome": "Odontologia",
    "descricao": "Atendimento odontologico infantil"
  }
}
```

### Atendimentos

```http
GET    /atendimentos
GET    /atendimentos/solicitados
GET    /atendimentos/voluntario/{voluntarioId}
GET    /atendimentos/beneficiario/{beneficiarioId}
GET    /atendimentos/{id}
POST   /atendimentos/solicitar
POST   /atendimentos
PUT    /atendimentos/{id}
DELETE /atendimentos/{id}
```

`GET /atendimentos` retorna todos os atendimentos.

`GET /atendimentos/solicitados` retorna a fila de atendimentos solicitados, considerando registros sem voluntario atribuido ou com status `SOLICITADO`, `ABERTO` ou `PENDENTE`.

`GET /atendimentos/voluntario/{voluntarioId}` retorna todos os atendimentos vinculados ao voluntario informado, sem limitar apenas aos ativos.

`GET /atendimentos/beneficiario/{beneficiarioId}` retorna os atendimentos da pessoa atendida/beneficiario informado.

`POST /atendimentos/solicitar` cria uma solicitacao de atendimento para beneficiario. O back-end define `status = SOLICITADO`, `dataAbertura = hoje`, `dataEncerramento = null` e `voluntario = null`.

Request de solicitacao:

```json
{
  "beneficiarioId": 10,
  "prioridade": 3,
  "canalComunicacaoId": 1,
  "descricao": "Preciso de ajuda com atendimento odontologico."
}
```

Request:

```json
{
  "pessoaAtendidaId": 1,
  "voluntarioId": 1,
  "canalComunicacaoId": 1,
  "prioridade": 2,
  "status": "ABERTO",
  "descricao": "Descricao do atendimento",
  "dataAbertura": "2026-05-09",
  "dataEncerramento": null
}
```

Response:

```json
{
  "id": 1,
  "pessoaAtendidaId": 1,
  "voluntario": {
    "id": 1,
    "nome": "Dra. Ana",
    "usuario": "ana.odonto",
    "acessoSigilo": true,
    "disponivel": true
  },
  "prioridade": 2,
  "status": "ABERTO",
  "descricao": "Descricao do atendimento",
  "canalOrigem": {
    "id": 1,
    "nome": "WhatsApp",
    "descricao": "Canal de atendimento via WhatsApp"
  },
  "dataAbertura": "2026-05-09"
}
```

### Mensagens

Chat vinculado a atendimento:

```http
GET  /atendimentos/{id}/mensagens
POST /atendimentos/{id}/mensagens
```

Request:

```json
{
  "conteudo": "Ola, preciso confirmar os detalhes do atendimento.",
  "enviadoPor": "BENEFICIARIO",
  "canalId": 1
}
```

Response:

```json
{
  "id": 1,
  "atendimentoId": 5,
  "conteudo": "Ola, preciso confirmar os detalhes do atendimento.",
  "dataHora": "2026-05-12T10:30:00",
  "enviadoPor": "BENEFICIARIO",
  "canal": {
    "id": 1,
    "nome": "WhatsApp",
    "descricao": "Canal de atendimento via WhatsApp"
  }
}
```

## Exemplos De Teste Manual

Criar canal:

```powershell
curl -X POST http://localhost:8080/canais `
  -H "Content-Type: application/json" `
  -d '{"nome":"WhatsApp","descricao":"Canal de atendimento via WhatsApp"}'
```

Listar canais:

```powershell
curl http://localhost:8080/canais
```

Criar especialidade:

```powershell
curl -X POST http://localhost:8080/especialidades `
  -H "Content-Type: application/json" `
  -d '{"nome":"Odontologia","descricao":"Atendimento odontologico infantil"}'
```

Criar voluntario:

```powershell
curl -X POST http://localhost:8080/voluntarios `
  -H "Content-Type: application/json" `
  -d '{"nome":"Dra. Ana","usuario":"ana.odonto","senha":"troque-esta-senha","acessoSigilo":true,"disponivel":true,"especialidadeId":1}'
```

Criar conta de voluntario para login:

```powershell
curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Dra. Ana","email":"ana@example.com","senha":"troque-esta-senha","tipoUsuario":"VOLUNTARIO","especialidadeId":1,"motivoVoluntariado":"Quero contribuir com atendimento odontologico para pessoas que precisam."}'
```

Antes da aprovacao, o login deve falhar:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"ana@example.com","senha":"troque-esta-senha"}'
```

Aprovar voluntario:

```powershell
curl -X PUT http://localhost:8080/voluntarios/1/aprovar
```

Depois da aprovacao, o login deve funcionar:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"ana@example.com","senha":"troque-esta-senha"}'
```

Testar email duplicado:

```powershell
curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Ana Duplicada","email":"ana@example.com","senha":"troque-esta-senha","tipoUsuario":"VOLUNTARIO"}'
```

Testar senha incorreta:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"ana@example.com","senha":"errada"}'
```

Testar email inexistente:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"naoexiste@example.com","senha":"troque-esta-senha"}'
```

Testar validacoes:

```powershell
curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Ana","email":"email-invalido","senha":"troque-esta-senha","tipoUsuario":"VOLUNTARIO"}'

curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Ana","email":"ana2@example.com","senha":"123","tipoUsuario":"VOLUNTARIO"}'
```

Verificar no banco que a senha nao esta em texto puro:

```sql
SELECT ID_CONTA, EMAIL, SENHA_HASH
FROM T_CONTA_USUARIO
WHERE EMAIL = 'ana@example.com';
```

O valor de `SENHA_HASH` deve iniciar com `PBKDF2$` e nao deve ser igual a senha digitada.

## SQL Oracle

O script da tabela de contas esta em:

```text
src/main/resources/sql/conta_usuario_oracle.sql
```

O script de migracao para aprovacao de voluntarios esta em:

```text
src/main/resources/sql/voluntario_aprovacao_oracle.sql
```

O script de migracao para beneficiario, solicitacao de atendimento e chat esta em:

```text
src/main/resources/sql/beneficiario_atendimento_chat_oracle.sql
```

Tabela criada:

```sql
DROP TABLE T_CONTA_USUARIO CASCADE CONSTRAINTS;

CREATE TABLE T_CONTA_USUARIO (
    ID_CONTA NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    NOME VARCHAR2(120) NOT NULL,
    EMAIL VARCHAR2(160) NOT NULL UNIQUE,
    SENHA_HASH VARCHAR2(255) NOT NULL,
    TIPO_USUARIO VARCHAR2(30) NOT NULL,
    ATIVO NUMBER(1) DEFAULT 1 NOT NULL,
    DATA_CRIACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT CK_CONTA_TIPO CHECK (TIPO_USUARIO IN ('VOLUNTARIO', 'BENEFICIARIO', 'ADMIN')),
    CONSTRAINT CK_CONTA_ATIVO CHECK (ATIVO IN (0, 1))
);
```

Migracao da tabela `VOLUNTARIO`:

```sql
ALTER TABLE VOLUNTARIO ADD (
    STATUS_APROVACAO VARCHAR2(30) DEFAULT 'PENDENTE' NOT NULL,
    MOTIVO_VOLUNTARIADO VARCHAR2(1000)
);

ALTER TABLE VOLUNTARIO ADD CONSTRAINT CK_VOLUNTARIO_STATUS_APROVACAO
CHECK (STATUS_APROVACAO IN ('PENDENTE', 'APROVADO', 'RECUSADO'));
```

Migracao de beneficiario/atendimento:

```sql
ALTER TABLE pessoa_atendida ADD ID_CONTA NUMBER;

ALTER TABLE pessoa_atendida ADD CONSTRAINT FK_PESSOA_ATENDIDA_CONTA
FOREIGN KEY (ID_CONTA) REFERENCES T_CONTA_USUARIO(ID_CONTA);

ALTER TABLE ATENDIMENTO ADD DESCRICAO VARCHAR2(1000);
```

## Teste Manual Beneficiario

Criar beneficiario:

```powershell
curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Ana Beneficiaria","email":"ana.beneficiaria@example.com","senha":"troque-esta-senha","tipoUsuario":"BENEFICIARIO"}'
```

Fazer login:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"ana.beneficiaria@example.com","senha":"troque-esta-senha"}'
```

Solicitar atendimento:

```powershell
curl -X POST http://localhost:8080/atendimentos/solicitar `
  -H "Content-Type: application/json" `
  -d '{"beneficiarioId":1,"prioridade":3,"canalComunicacaoId":1,"descricao":"Preciso de ajuda com atendimento odontologico."}'
```

Listar meus atendimentos:

```powershell
curl http://localhost:8080/atendimentos/beneficiario/1
```

Enviar mensagem:

```powershell
curl -X POST http://localhost:8080/atendimentos/1/mensagens `
  -H "Content-Type: application/json" `
  -d '{"conteudo":"Ola, preciso de ajuda.","enviadoPor":"BENEFICIARIO","canalId":1}'
```

Listar mensagens:

```powershell
curl http://localhost:8080/atendimentos/1/mensagens
```

## Integracao Com Front-End

Este repositorio Git contem apenas o back-end Quarkus. Nao ha `package.json`, `vite.config`, `src/services`, telas React ou arquivos TypeScript versionados nesta pasta, portanto nao foi possivel alterar nem validar o build do front-end aqui.

Quando o front React/Vite estiver no workspace, a integracao deve chamar a API com `fetch`:

```ts
export type TipoUsuario = "VOLUNTARIO" | "BENEFICIARIO" | "ADMIN";

export type RegisterRequest = {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: TipoUsuario;
  especialidadeId?: number;
  motivoVoluntariado?: string;
};

export type LoginRequest = {
  email: string;
  senha: string;
};

export type AuthUser = {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  ativo?: boolean;
  dataCriacao?: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function requestAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.mensagem ?? "Erro ao conectar com o servidor.");
  }
  return data as T;
}

export function register(request: RegisterRequest) {
  return requestAuth<AuthUser>("/auth/register", request);
}

export function login(request: LoginRequest) {
  return requestAuth<AuthUser>("/auth/login", request);
}
```

Validacoes esperadas no front:

```text
nome obrigatorio
email obrigatorio e em formato valido
senha obrigatoria com minimo de 6 caracteres
confirmarSenha igual a senha
tipoUsuario VOLUNTARIO, BENEFICIARIO ou ADMIN
para VOLUNTARIO: especialidadeId obrigatorio e motivoVoluntariado com minimo de 20 caracteres
```

## Tratamento De Erros

A API possui exceptions proprias e retorna erro em JSON:

```json
{
  "erro": "NAO_ENCONTRADO",
  "mensagem": "Voluntario nao encontrado",
  "dataHora": "2026-05-09T15:30:00"
}
```

Tipos principais:

```text
REGRA_NEGOCIO
BANCO_DADOS
NAO_ENCONTRADO
ERRO_INTERNO
```

## Observacoes Para A Sprint 4

- A estrutura segue o pacote raiz `br.com.tdbresponde`.
- As camadas `BO` e `DAO` foram mantidas.
- A persistencia continua com JDBC manual.
- A conexao com banco nao fica hardcoded no codigo.
- Os endpoints principais usam DTOs de request e response.
- Os testes antigos em `src/test/java/test` ainda sao runners manuais; o proximo passo recomendado e criar testes automatizados com `@QuarkusTest`.
