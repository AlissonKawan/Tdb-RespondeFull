-- ============================================================
-- TDB Responde - Sprint 4 - Oracle SQL
-- 05_relatorios.sql
--
-- Relatorios exigidos pela Sprint 4.
-- Execute depois de 03_insert_data.sql.
-- ============================================================

-- 1) Relatorio com classificacao/ordenacao de dados.
-- Lista atendimentos por prioridade e data de abertura.
SELECT
    A.ID,
    P.NOME_CODIFICADO,
    P.TIPO,
    A.PRIORIDADE,
    A.STATUS,
    A.DATA_ABERTURA
FROM ATENDIMENTO A
JOIN PESSOA_ATENDIDA P
    ON P.ID = A.PESSOA_ATENDIDA_ID
ORDER BY A.PRIORIDADE ASC, A.DATA_ABERTURA ASC;

-- 2) Relatorio usando funcao numerica simples.
-- Calcula dias em aberto ou duracao ate o encerramento.
SELECT
    A.ID,
    A.STATUS,
    A.DATA_ABERTURA,
    A.DATA_ENCERRAMENTO,
    ROUND(NVL(A.DATA_ENCERRAMENTO, SYSDATE) - A.DATA_ABERTURA) AS DIAS_DE_ATENDIMENTO
FROM ATENDIMENTO A
ORDER BY DIAS_DE_ATENDIMENTO DESC;

-- 3) Relatorio usando funcao de grupo.
-- Conta atendimentos por status e calcula prioridade media.
SELECT
    A.STATUS,
    COUNT(*) AS TOTAL_ATENDIMENTOS,
    ROUND(AVG(A.PRIORIDADE), 2) AS PRIORIDADE_MEDIA
FROM ATENDIMENTO A
GROUP BY A.STATUS
ORDER BY TOTAL_ATENDIMENTOS DESC, A.STATUS;

-- 4) Relatorio usando subconsulta.
-- Pessoas com atendimentos mais urgentes que a media geral.
SELECT
    P.ID,
    P.NOME_CODIFICADO,
    P.TIPO,
    A.ID AS ATENDIMENTO_ID,
    A.PRIORIDADE
FROM PESSOA_ATENDIDA P
JOIN ATENDIMENTO A
    ON A.PESSOA_ATENDIDA_ID = P.ID
WHERE A.PRIORIDADE < (
    SELECT AVG(PRIORIDADE)
    FROM ATENDIMENTO
)
ORDER BY A.PRIORIDADE ASC, P.NOME_CODIFICADO;

-- 5) Relatorio usando juncao de tabelas.
-- Visao operacional com pessoa, voluntario, canal e mensagem.
SELECT
    A.ID AS ATENDIMENTO_ID,
    P.NOME_CODIFICADO,
    P.TIPO,
    NVL(V.NOME, 'Aguardando voluntario') AS VOLUNTARIO,
    C.NOME AS CANAL,
    A.STATUS,
    A.PRIORIDADE,
    COUNT(M.ID) AS TOTAL_MENSAGENS
FROM ATENDIMENTO A
JOIN PESSOA_ATENDIDA P
    ON P.ID = A.PESSOA_ATENDIDA_ID
LEFT JOIN VOLUNTARIO V
    ON V.ID = A.VOLUNTARIO_ID
JOIN CANAL_COMUNICACAO C
    ON C.ID = A.CANAL_COMUNICACAO_ID
LEFT JOIN MENSAGEM M
    ON M.ATENDIMENTO_ID = A.ID
GROUP BY
    A.ID,
    P.NOME_CODIFICADO,
    P.TIPO,
    V.NOME,
    C.NOME,
    A.STATUS,
    A.PRIORIDADE
ORDER BY A.ID;

-- 6) Relatorio extra: voluntarios por especialidade.
SELECT
    E.NOME AS ESPECIALIDADE,
    COUNT(VE.VOLUNTARIO_ID) AS TOTAL_VOLUNTARIOS
FROM ESPECIALIDADE E
LEFT JOIN VOLUNTARIO_ESPECIALIDADE VE
    ON VE.ESPECIALIDADE_ID = E.ID
GROUP BY E.NOME
ORDER BY TOTAL_VOLUNTARIOS DESC, E.NOME;
