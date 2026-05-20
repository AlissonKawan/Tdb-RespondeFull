# Backend

API Java do Projeto TDB Responde.

## Java

Use Java 21 LTS. Evite rodar o backend com Java 26, porque o projeto foi ajustado e validado para Java 21.

No PowerShell, confira a versao ativa:

```powershell
java -version
```

No IntelliJ, selecione um JDK 21 em `File > Project Structure > Project SDK` e tambÃ©m em `Settings > Build, Execution, Deployment > Build Tools > Maven > JDK for importer`.

## Banco Oracle

A conexao fica centralizada em `src/main/resources/application.properties`.

URL padrao:

```properties
jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl
```

Defina usuario e senha por variaveis de ambiente quando quiser sobrescrever os valores locais:

```powershell
$env:DB_USERNAME="seu_rm"
$env:DB_PASSWORD="sua_senha"
$env:DB_URL="jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl"
```

## Como executar

Use os comandos Maven a partir desta pasta:

```bash
mvn quarkus:dev
```

## Testar Conexao

Com o backend rodando, teste primeiro:

```http
GET http://localhost:8080/health/db
```

Resposta esperada:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Admin Inicial

O admin inicial pode ser criado ou atualizado no startup apenas em ambiente local/dev.
Esse seed fica desligado por padrao para nao sobrescrever senha em producao.

PowerShell:

```powershell
$env:ADMIN_SEED_EMAIL="admin@tdbresponde.com"
$env:ADMIN_SEED_PASSWORD="troque-esta-senha"
mvn quarkus:dev
```

Depois que o log confirmar o admin, desligue o seed:

```powershell
Remove-Item Env:ADMIN_SEED_ENABLED
```

Login para teste:

```json
{
  "email": "admin@tdbresponde.com",
  "senha": "troque-esta-senha"
}
```
