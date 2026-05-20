# Database - TDB Responde

Scripts Oracle SQL organizados para a Sprint 4 de Building Relational Database.

## Ordem De Execucao

Execute os arquivos nesta ordem:

```text
01_drop_tables.sql
02_create_tables.sql
03_insert_data.sql
04_updates_deletes.sql
05_relatorios.sql
```

## Conteudo

- `01_drop_tables.sql`: remove as tabelas em ordem segura, ignorando erro quando ainda nao existem.
- `02_create_tables.sql`: cria as tabelas, constraints, FKs, indices auxiliares e a view `VW_VOLUNTARIO_COMPLETO`.
- `03_insert_data.sql`: insere dados demonstrativos coerentes com o projeto. Cada tabela exigida tem pelo menos 7 registros.
- `04_updates_deletes.sql`: contem 3 testes de `UPDATE` e 3 testes de `DELETE`. Usa `SAVEPOINT` e `ROLLBACK TO` para demonstrar os comandos sem reduzir a massa principal.
- `05_relatorios.sql`: contem relatorios com ordenacao, funcao numerica, funcao de grupo, subconsulta e juncao de tabelas.

## Tabelas Atendidas

- `T_CONTA_USUARIO`
- `PESSOA_ATENDIDA`
- `VOLUNTARIO`
- `ESPECIALIDADE`
- `VOLUNTARIO_ESPECIALIDADE`
- `ATENDIMENTO`
- `CANAL_COMUNICACAO`
- `MENSAGEM`
- `MENSAGEM_CANAL`
- `HISTORICO_STATUS`
- `CRIANCA_ADOLESCENTE`
- `MULHER_APOLONIA`

## Observacoes

- Os nomes de tabelas e colunas foram mantidos alinhados ao backend Java.
- Os dados usam e-mails e hashes demonstrativos, sem credenciais reais.
- Os scripts usam sintaxe Oracle, incluindo blocos PL/SQL para `DROP TABLE` seguro.
- O arquivo de updates/deletes nao quebra as FKs porque cria registros temporarios para os testes de exclusao e desfaz as alteracoes ao final.
