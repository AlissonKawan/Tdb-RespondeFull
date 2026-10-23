-- Revisar e executar manualmente durante a implantacao coordenada do backend.
-- Remove os dados historicos de canal, o vinculo de mensagens e a coluna de origem.
-- Faca backup antes: a operacao nao e reversivel sem restauracao dos dados.

ALTER TABLE ATENDIMENTO DROP CONSTRAINT FK_AT_CANAL;
ALTER TABLE ATENDIMENTO DROP COLUMN CANAL_COMUNICACAO_ID;

DROP TABLE MENSAGEM_CANAL CASCADE CONSTRAINTS;
DROP TABLE CANAL_COMUNICACAO CASCADE CONSTRAINTS;

-- Verificacao pos-execucao: ambos os resultados devem ser zero.
SELECT COUNT(*) AS TABELAS_REMANESCENTES
FROM USER_TABLES
WHERE TABLE_NAME IN ('MENSAGEM_CANAL', 'CANAL_COMUNICACAO');
SELECT COUNT(*) AS COLUNAS_REMANESCENTES
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'ATENDIMENTO' AND COLUMN_NAME = 'CANAL_COMUNICACAO_ID';
