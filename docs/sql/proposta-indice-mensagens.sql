-- PROPOSTA PARA REVISAO. Nao foi executada e nao faz parte do startup.
-- Somente consultas de metadados estao ativas neste arquivo.
-- Confirmar o schema conectado, a versao do Oracle e os indices equivalentes.
SELECT USER AS SCHEMA_ATUAL FROM DUAL;

SELECT I.INDEX_NAME, I.STATUS, C.COLUMN_POSITION, C.COLUMN_NAME, C.DESCEND
FROM USER_INDEXES I
JOIN USER_IND_COLUMNS C ON C.INDEX_NAME = I.INDEX_NAME AND C.TABLE_NAME = I.TABLE_NAME
WHERE I.TABLE_NAME = 'MENSAGEM'
ORDER BY I.INDEX_NAME, C.COLUMN_POSITION;

-- Candidato para o filtro por atendimento, ordenacao e cursor de mensagens.
-- Antes de autorizar: avaliar plano, seletividade, espaco, custo de INSERT/UPDATE,
-- volume da tabela e locks na versao/edicao efetivamente instalada.
-- Se existir indice equivalente, nao criar outro.
-- Em homologacao isolada, comparar plano, linhas lidas e p50/p95 antes/depois
-- com os mesmos dados sinteticos, aquecimento e concorrencia.
-- Somente apos autorizacao explicita do responsavel pelo banco:
-- CREATE INDEX IDX_MSG_ATEND_DATA_ID ON MENSAGEM (ATENDIMENTO_ID, DATA_HORA, ID);

-- Verificar STATUS em USER_INDEXES apos criacao e validar leituras e escritas.
-- A criacao consome armazenamento, pode bloquear operacoes e aumenta manutencao
-- nas escritas. Nao existe promessa de ganho sem plano e medicao.
-- DDL no Oracle pode efetuar commit implicito; ROLLBACK nao desfaz CREATE INDEX.
-- Recuperacao, somente com autorizacao especifica, se o indice foi criado nesta
-- intervencao e a remocao foi avaliada pelo responsavel:
-- DROP INDEX IDX_MSG_ATEND_DATA_ID;
