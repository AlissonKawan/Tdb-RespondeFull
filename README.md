# Projeto TDB Responde

Projeto Java migrado para Quarkus com Maven, REST e JDBC Oracle.

## Rodar em desenvolvimento

Configure as credenciais do banco antes de usar endpoints que acessam Oracle:

```powershell
$env:DB_USERNAME="seu_usuario"
$env:DB_PASSWORD="sua_senha"
$env:DB_URL="jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl"
mvn quarkus:dev
```

Endpoint simples para validar a aplicação sem banco:

```text
GET http://localhost:8080/ping
```

## Endpoints criados

```text
GET    /ping
GET    /canais
GET    /canais/{id}
POST   /canais
PUT    /canais/{id}
DELETE /canais/{id}

GET    /especialidades
GET    /especialidades/{id}
POST   /especialidades
PUT    /especialidades/{id}
DELETE /especialidades/{id}

GET    /voluntarios
GET    /voluntarios/{id}
POST   /voluntarios
PUT    /voluntarios/{id}
DELETE /voluntarios/{id}

GET    /atendimentos
GET    /atendimentos/{id}
POST   /atendimentos
PUT    /atendimentos/{id}
DELETE /atendimentos/{id}
```

## Build

```powershell
mvn -DskipTests package
```
