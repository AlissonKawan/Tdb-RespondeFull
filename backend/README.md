# TDB Responde - Back-end Java

## Descricao

API REST desenvolvida em Java com Quarkus para o projeto TDB Responde, solucao criada para apoiar o atendimento social, conectando pessoas atendidas, voluntarios e administradores.

## Repositorio GitHub

Repositorio do projeto:
https://github.com/AlissonKawan/Tdb-RespondeFull/tree/Alisson/backend

## API publicada

https://tdb-respondefull.onrender.com

## Tecnologias utilizadas

- Java 21
- Quarkus
- Maven
- Oracle SQL
- JDBC
- API REST
- Git e GitHub

## Estrutura do back-end

- `model`: classes de modelo do dominio, como `Atendimento`, `Voluntario`, `PessoaAtendida`, `Mensagem` e `Especialidade`.
- `dao`: classes de acesso ao banco de dados Oracle usando JDBC.
- `bo`: regras de negocio da aplicacao, como cadastro, login, atendimento, voluntarios e mensagens.
- `resource`: endpoints REST expostos pela API Quarkus.
- `dto`: objetos de entrada e saida da API.
- `exception`: excecoes customizadas e mappers de erro HTTP.
- `config`: configuracoes auxiliares do projeto, incluindo seed opcional de administrador.
- `security`: utilitarios de seguranca, como hash e validacao de senha.

## Funcionalidades principais

- Autenticacao de usuarios
- Cadastro e consulta de voluntarios
- Aprovacao de voluntarios
- Cadastro e consulta de pessoas atendidas
- Registro e acompanhamento de atendimentos
- Envio e consulta de mensagens
- Consulta de especialidades
- Consulta de canais de comunicacao

## Endpoints principais

| Metodo HTTP | Endpoint | Descricao |
|---|---|---|
| GET | `/ping` | Verifica se a API esta respondendo. |
| GET | `/health/db` | Verifica a conexao com o banco de dados. |
| POST | `/auth/login` | Autentica um usuario. |
| POST | `/auth/register` | Cadastra usuario voluntario ou beneficiario. |
| GET | `/usuarios` | Lista usuarios cadastrados. |
| GET | `/usuarios/{id}` | Busca usuario por ID. |
| PUT | `/usuarios/{id}` | Atualiza dados de usuario. |
| DELETE | `/usuarios/{id}` | Desativa usuario. |
| GET | `/voluntarios` | Lista voluntarios. |
| GET | `/voluntarios/pendentes` | Lista voluntarios pendentes de aprovacao. |
| GET | `/voluntarios/ativos` | Lista voluntarios ativos. |
| GET | `/voluntarios/{id}` | Busca voluntario por ID. |
| POST | `/voluntarios` | Cadastra voluntario. |
| PUT | `/voluntarios/{id}` | Atualiza voluntario. |
| PUT | `/voluntarios/{id}/aprovar` | Aprova cadastro de voluntario. |
| DELETE | `/voluntarios/{id}` | Exclui voluntario. |
| GET | `/especialidades` | Lista especialidades. |
| GET | `/especialidades/{id}` | Busca especialidade por ID. |
| POST | `/especialidades` | Cadastra especialidade. |
| PUT | `/especialidades/{id}` | Atualiza especialidade. |
| DELETE | `/especialidades/{id}` | Exclui especialidade. |
| GET | `/canais` | Lista canais de comunicacao. |
| GET | `/canais/{id}` | Busca canal de comunicacao por ID. |
| POST | `/canais` | Cadastra canal de comunicacao. |
| PUT | `/canais/{id}` | Atualiza canal de comunicacao. |
| DELETE | `/canais/{id}` | Exclui canal de comunicacao. |
| GET | `/atendimentos` | Lista atendimentos. |
| GET | `/atendimentos/solicitados` | Lista atendimentos solicitados ou em aberto. |
| GET | `/atendimentos/voluntario/{voluntarioId}` | Lista atendimentos por voluntario. |
| GET | `/atendimentos/beneficiario/{beneficiarioId}` | Lista atendimentos por beneficiario. |
| GET | `/atendimentos/beneficiario/conta/{contaId}` | Lista atendimentos por conta de beneficiario. |
| GET | `/atendimentos/em-andamento` | Lista atendimentos em andamento. |
| GET | `/atendimentos/encerrados` | Lista atendimentos encerrados. |
| POST | `/atendimentos` | Cadastra atendimento. |
| POST | `/atendimentos/solicitar` | Solicita atendimento para beneficiario. |
| POST | `/atendimentos/relatar` | Registra relato de situacao. |
| GET | `/atendimentos/{id}` | Busca atendimento por ID. |
| PUT | `/atendimentos/{id}` | Atualiza atendimento. |
| PUT | `/atendimentos/{id}/status-prioridade` | Atualiza status e prioridade do atendimento. |
| PUT | `/atendimentos/{id}/encerrar` | Encerra atendimento. |
| PUT | `/atendimentos/{id}/assumir` | Permite que voluntario assuma atendimento. |
| DELETE | `/atendimentos/{id}` | Exclui atendimento. |
| GET | `/atendimentos/{id}/mensagens` | Lista mensagens de um atendimento. |
| POST | `/atendimentos/{id}/mensagens` | Envia mensagem em um atendimento. |
| GET | `/mensagens/{id}` | Busca mensagem por ID. |
| GET | `/mensagens/atendimento/{atendimentoId}` | Lista mensagens por atendimento. |
| POST | `/mensagens` | Cadastra mensagem. |

## Cronograma em Java

As rotas existentes em `/api/cronograma/tarefas` oferecem criação, consulta por ID,
listagem por voluntário (filtros `dia_semana`, `status`, `prioridade`),
atualização, exclusão e resumo semanal. O acesso ao Oracle usa o DataSource
do Java e a tabela `T_TAREFA_CRONOGRAMA`, preservando os dados existentes.

Em ambiente novo, criar a tabela com `src/main/resources/sql/cronograma.sql`.
Não executar esse script em uma tabela já existente. Datas de atividade e horários
mantêm o contrato textual anterior. Nenhum script é executado automaticamente.

A classificação de mensagens foi removida. A previsão de check-in pelo Gemini
continua no cliente Java `IaClient`.

### Validacao opcional no Oracle

Na pasta `backend`, configure credenciais reais em `.env` (nao versionado) ou nas
variaveis `DB_URL`, `DB_USERNAME` e `DB_PASSWORD`. Nunca coloque senhas no codigo.
Para executar o teste de integracao no PowerShell:

```powershell
$env:TDB_ORACLE_VALIDATION = 'true'
try {
    .\mvnw.cmd test '-Dtest=CronogramaOracleIntegrationTest'
} finally {
    Remove-Item Env:TDB_ORACLE_VALIDATION -ErrorAction SilentlyContinue
}
```

O teste exige a tabela existente e um voluntario cadastrado. Verifica o schema,
CRUD, filtros e resumo semanal em uma transacao com rollback, sem iniciar o
Quarkus nem executar scripts de criacao. O Oracle pode consumir um numero da
sequencia/identity mesmo com rollback. Sem a variavel de ativacao, o teste e
ignorado. ORA-01017 indica que as credenciais precisam ser corrigidas localmente.

## Variaveis de ambiente

Para rodar o projeto, configure as variaveis de ambiente abaixo:

- `DB_URL`: URL JDBC do banco Oracle.
- `DB_USERNAME`: usuario do banco Oracle.
- `DB_PASSWORD`: senha do banco Oracle.
- `PORT`: porta HTTP usada no deploy, quando necessario.

Exemplo:

```properties
DB_URL=jdbc:oracle:thin:@oracle.fiap.com.br:1521:orcl
DB_USERNAME=SEU_RM
DB_PASSWORD=SUA_SENHA
PORT=8080
```

## Como executar localmente

1. Entrar na pasta `backend`:

```bash
cd backend
```

2. Rodar em modo desenvolvimento:

```bash
mvn quarkus:dev
```

3. Gerar build:

```bash
mvn clean package -DskipTests
```

4. Testar a API:

```text
http://localhost:8080/ping
```

## Banco de dados

A API utiliza Oracle SQL com acesso via JDBC. Antes de executar endpoints que dependem de persistencia, as tabelas precisam estar criadas conforme os scripts da pasta `database/` do projeto.

Ordem recomendada dos scripts:

```text
01_drop_tables.sql
02_create_tables.sql
03_insert_data.sql
04_updates_deletes.sql
05_relatorios.sql
```

## Integrantes

- Alisson Kawan - RM: 567598 - GitHub: https://github.com/AlissonKawan - LinkedIn: https://www.linkedin.com/in/AlissonKawan
- Marcos Vinicius - RM: 567214 - GitHub: https://github.com/marcos-thebest - LinkedIn: https://www.linkedin.com/in/marcos-vinicius-de-jesus-almeida/
- Eduardo Boni - RM: 567236 - GitHub: https://github.com/bonieduardo75 - LinkedIn: https://www.linkedin.com/in/eduardo-boni-b6b851310
