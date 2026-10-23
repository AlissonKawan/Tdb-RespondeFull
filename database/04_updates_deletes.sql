-- ============================================================
-- TDB Responde - Sprint 4 - Oracle SQL
-- 04_updates_deletes.sql
--
-- Dois testes de UPDATE e tres testes de DELETE.
-- O script usa SAVEPOINT/ROLLBACK para demonstrar os comandos sem
-- reduzir a massa principal de 7+ registros por tabela.
-- Execute depois de 03_insert_data.sql.
-- ============================================================

SAVEPOINT SP_TESTES_DML;

-- ------------------------------------------------------------
-- TESTES DE UPDATE
-- ------------------------------------------------------------

-- 1) Aprovar voluntario pendente.
UPDATE VOLUNTARIO
SET STATUS_APROVACAO = 'APROVADO',
    DISPONIVEL = 1
WHERE ID = 7;

-- 2) Assumir atendimento aberto por um voluntario disponivel.
UPDATE ATENDIMENTO
SET VOLUNTARIO_ID = 1,
    STATUS = 'EM_ATENDIMENTO'
WHERE ID = 7;

INSERT INTO HISTORICO_STATUS (ATENDIMENTO_ID, STATUS_ANTERIOR, STATUS_NOVO, ALTERADO_POR_ID, DATA_HORA)
VALUES (7, 'ABERTO', 'EM_ATENDIMENTO', 1, CURRENT_TIMESTAMP);

-- Conferencia dos updates.
SELECT ID, STATUS_APROVACAO, DISPONIVEL
FROM VOLUNTARIO
WHERE ID = 7;

SELECT ID, VOLUNTARIO_ID, STATUS
FROM ATENDIMENTO
WHERE ID = 7;

-- ------------------------------------------------------------
-- TESTES DE DELETE
-- ------------------------------------------------------------
-- Para nao quebrar FKs nem apagar a massa principal, os deletes usam
-- registros temporarios criados dentro deste bloco.

INSERT INTO T_CONTA_USUARIO (ID_CONTA, NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO)
VALUES (90, 'Conta temporaria delete', 'delete.temp@example.com', 'hash_delete_temp', 'BENEFICIARIO', 1);

INSERT INTO PESSOA_ATENDIDA (ID, NOME_CODIFICADO, DATA_CADASTRO, TELEFONE, EMAIL, TIPO, ID_CONTA)
VALUES (90, 'TMP-DELETE-090', SYSDATE, '11999990090', 'tmp.delete@example.com', 'OUTRO', 90);

INSERT INTO ATENDIMENTO (ID, PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, PRIORIDADE, STATUS, DATA_ABERTURA, DESCRICAO)
VALUES (90, 90, NULL, 4, 'ABERTO', SYSDATE, 'Atendimento temporario para teste de delete.');

INSERT INTO MENSAGEM (ID, ATENDIMENTO_ID, CONTEUDO, DATA_HORA, ENVIADO_POR)
VALUES (90, 90, 'Mensagem temporaria para teste de delete.', CURRENT_TIMESTAMP, 'BENEFICIARIO');

-- 1) Deletar mensagem temporaria.
DELETE FROM MENSAGEM
WHERE ID = 90;

-- 2) Deletar atendimento temporario.
DELETE FROM ATENDIMENTO
WHERE ID = 90;

-- Limpeza dos registros temporarios restantes.
DELETE FROM PESSOA_ATENDIDA WHERE ID = 90;
DELETE FROM T_CONTA_USUARIO WHERE ID_CONTA = 90;

-- Conferencia: todos os temporarios devem retornar zero.
SELECT 'TEMP_MENSAGEM' AS TESTE, COUNT(*) AS TOTAL FROM MENSAGEM WHERE ID = 90
UNION ALL
SELECT 'TEMP_ATENDIMENTO', COUNT(*) FROM ATENDIMENTO WHERE ID = 90;

-- Volta ao estado original para manter a base dos relatorios intacta.
ROLLBACK TO SP_TESTES_DML;

-- Conferencia final: a massa principal segue com pelo menos 7 registros.
SELECT 'ATENDIMENTO' AS TABELA, COUNT(*) AS TOTAL FROM ATENDIMENTO
UNION ALL SELECT 'MENSAGEM', COUNT(*) FROM MENSAGEM
UNION ALL SELECT 'HISTORICO_STATUS', COUNT(*) FROM HISTORICO_STATUS;
