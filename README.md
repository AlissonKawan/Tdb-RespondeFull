# Projeto TDB Responde

API REST desenvolvida em Java com Quarkus para gerenciar atendimentos, canais de comunicacao, especialidades e voluntarios do projeto TDB Responde.

O projeto foi organizado para a entrega da Sprint 4 mantendo as camadas exigidas de `Resource`, `BO`, `DAO` e `Model`, com persistencia via JDBC manual e conexao Oracle gerenciada pelo Quarkus.

## Tecnologias

- Java 17
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

A conexao com Oracle e configurada em `src/main/resources/application.properties`:

```properties
quarkus.datasource.db-kind=oracle
quarkus.datasource.jdbc.url=${DB_URL:jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl}
quarkus.datasource.username=${DB_USERNAME:}
quarkus.datasource.password=${DB_PASSWORD:}
```

Antes de executar endpoints que acessam o banco, defina as variaveis de ambiente.

PowerShell:

```powershell
$env:DB_USERNAME="seu_usuario"
$env:DB_PASSWORD="sua_senha"
$env:DB_URL="jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl"
```

## Executando O Projeto

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
  "email": "ana@email.com",
  "senha": "123456",
  "tipoUsuario": "VOLUNTARIO"
}
```

Login:

```json
{
  "email": "ana@email.com",
  "senha": "123456"
}
```

Resposta de sucesso:

```json
{
  "id": 1,
  "nome": "Dra. Ana",
  "email": "ana@email.com",
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
  "email": "ana.silva@email.com",
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
GET    /voluntarios/{id}
POST   /voluntarios
PUT    /voluntarios/{id}
DELETE /voluntarios/{id}
```

Request:

```json
{
  "nome": "Dra. Ana",
  "usuario": "ana.odonto",
  "senha": "123456",
  "acessoSigilo": true,
  "disponivel": true,
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
GET    /atendimentos/{id}
POST   /atendimentos
PUT    /atendimentos/{id}
DELETE /atendimentos/{id}
```

`GET /atendimentos` retorna todos os atendimentos.

`GET /atendimentos/solicitados` retorna a fila de atendimentos solicitados, considerando registros sem voluntario atribuido ou com status `SOLICITADO`, `ABERTO` ou `PENDENTE`.

`GET /atendimentos/voluntario/{voluntarioId}` retorna todos os atendimentos vinculados ao voluntario informado, sem limitar apenas aos ativos.

Request:

```json
{
  "pessoaAtendidaId": 1,
  "voluntarioId": 1,
  "canalComunicacaoId": 1,
  "prioridade": 2,
  "status": "ABERTO",
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
  "canalOrigem": {
    "id": 1,
    "nome": "WhatsApp",
    "descricao": "Canal de atendimento via WhatsApp"
  },
  "dataAbertura": "2026-05-09"
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
  -d '{"nome":"Dra. Ana","usuario":"ana.odonto","senha":"123456","acessoSigilo":true,"disponivel":true,"especialidadeId":1}'
```

Criar conta de voluntario para login:

```powershell
curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Dra. Ana","email":"ana@email.com","senha":"123456","tipoUsuario":"VOLUNTARIO"}'
```

Fazer login:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"ana@email.com","senha":"123456"}'
```

Testar email duplicado:

```powershell
curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Ana Duplicada","email":"ana@email.com","senha":"123456","tipoUsuario":"VOLUNTARIO"}'
```

Testar senha incorreta:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"ana@email.com","senha":"errada"}'
```

Testar email inexistente:

```powershell
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"naoexiste@email.com","senha":"123456"}'
```

Testar validacoes:

```powershell
curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Ana","email":"email-invalido","senha":"123456","tipoUsuario":"VOLUNTARIO"}'

curl -X POST http://localhost:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{"nome":"Ana","email":"ana2@email.com","senha":"123","tipoUsuario":"VOLUNTARIO"}'
```

Verificar no banco que a senha nao esta em texto puro:

```sql
SELECT ID_CONTA, EMAIL, SENHA_HASH
FROM T_CONTA_USUARIO
WHERE EMAIL = 'ana@email.com';
```

O valor de `SENHA_HASH` deve iniciar com `PBKDF2$` e nao deve ser igual a senha digitada.

## SQL Oracle

O script da tabela de contas esta em:

```text
src/main/resources/sql/conta_usuario_oracle.sql
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
