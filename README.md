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
GET    /atendimentos/{id}
POST   /atendimentos
PUT    /atendimentos/{id}
DELETE /atendimentos/{id}
```

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
