-- MIGRACAO MANUAL: PRIVACIDADE APOLONIAS. NUNCA executar no startup.
-- Alteracao autorizada em conversa em 23/10/2026; confirmar o ambiente de destino.
-- Aplicar ANTES de utilizar o novo cadastro e acesso por usuario.
-- A correcao de compatibilidade permite o login anterior sem estas colunas.
-- Conferir schema real e backup antes de executar, com SQLcl/SQL*Plus ou F5.
-- DDL Oracle faz commit implicito: ROLLBACK nao desfaz estes comandos.
-- Sem backfill: contas existentes continuam acessando por email.
-- Pode ser reaplicado: verifica colunas, indice e constraints existentes.
-- Objetos existentes com definicoes diferentes interrompem a execucao.
-- Uma falha pode deixar DDL parcial ja confirmado; corrigir a causa e reaplicar.

WHENEVER SQLERROR EXIT SQL.SQLCODE
SET SERVEROUTPUT ON

DECLARE
    v_total NUMBER;
    v_nullable VARCHAR2(1);
    v_tabela VARCHAR2(128);
    v_unico VARCHAR2(10);
    v_status VARCHAR2(10);
    v_expressao VARCHAR2(32767);
    c_programa CONSTANT VARCHAR2(300) :=
        'TIPO_BENEFICIARIO IN (''MULHER_APOLONIA'', ''CRIANCA_ADOLESCENTE'')';
    c_identificacao CONSTANT VARCHAR2(300) :=
        'MODO_IDENTIFICACAO IN (''NOME'', ''CODINOME'', ''GERADO'')';
    c_acesso CONSTANT VARCHAR2(1000) :=
        'EMAIL IS NOT NULL OR (' ||
        'TIPO_USUARIO = ''BENEFICIARIO'' ' ||
        'AND TIPO_BENEFICIARIO IS NOT NULL AND TIPO_BENEFICIARIO = ''MULHER_APOLONIA'' ' ||
        'AND USUARIO IS NOT NULL AND MODO_IDENTIFICACAO IS NOT NULL)';

    FUNCTION normalizar(p_texto VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
        RETURN REGEXP_REPLACE(UPPER(p_texto), '[[:space:]"]', '');
    END;

    PROCEDURE coluna(p_nome VARCHAR2, p_tamanho NUMBER, p_criar BOOLEAN) IS
        v_tipo VARCHAR2(128);
        v_tamanho NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_total FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = 'T_CONTA_USUARIO' AND COLUMN_NAME = p_nome;
        IF v_total = 0 THEN
            IF p_criar THEN
                EXECUTE IMMEDIATE 'ALTER TABLE T_CONTA_USUARIO ADD (' || p_nome ||
                    ' VARCHAR2(' || TO_CHAR(p_tamanho, 'FM9990') || '))';
                DBMS_OUTPUT.PUT_LINE('Coluna adicionada: ' || p_nome);
            END IF;
        ELSE
            SELECT DATA_TYPE, CHAR_LENGTH INTO v_tipo, v_tamanho FROM USER_TAB_COLUMNS
            WHERE TABLE_NAME = 'T_CONTA_USUARIO' AND COLUMN_NAME = p_nome;
            IF v_tipo <> 'VARCHAR2' OR v_tamanho < p_tamanho THEN
                RAISE_APPLICATION_ERROR(-20001, 'Revisar tipo/tamanho da coluna ' || p_nome);
            END IF;
        END IF;
    END;

    PROCEDURE regra(p_nome VARCHAR2, p_condicao VARCHAR2, p_criar BOOLEAN) IS
        v_tipo VARCHAR2(1);
        v_validado VARCHAR2(13);
    BEGIN
        SELECT COUNT(*) INTO v_total FROM USER_CONSTRAINTS WHERE CONSTRAINT_NAME = p_nome;
        IF v_total = 0 THEN
            IF p_criar THEN
                EXECUTE IMMEDIATE 'ALTER TABLE T_CONTA_USUARIO ADD CONSTRAINT ' ||
                    p_nome || ' CHECK (' || p_condicao || ') ENABLE VALIDATE';
                DBMS_OUTPUT.PUT_LINE('Regra adicionada: ' || p_nome);
            END IF;
        ELSE
            SELECT TABLE_NAME, CONSTRAINT_TYPE, STATUS, VALIDATED, SEARCH_CONDITION
            INTO v_tabela, v_tipo, v_status, v_validado, v_expressao
            FROM USER_CONSTRAINTS WHERE CONSTRAINT_NAME = p_nome;
            IF v_tabela <> 'T_CONTA_USUARIO' OR v_tipo <> 'C'
                OR v_status <> 'ENABLED' OR v_validado <> 'VALIDATED'
                OR NVL(normalizar(v_expressao), '?') <> normalizar(p_condicao) THEN
                RAISE_APPLICATION_ERROR(-20002, 'Revisar definicao da constraint ' || p_nome);
            END IF;
        END IF;
    END;

BEGIN
    IF SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') <> SYS_CONTEXT('USERENV', 'SESSION_USER') THEN
        RAISE_APPLICATION_ERROR(-20003, 'Executar como proprietario do schema de destino.');
    END IF;
    SELECT COUNT(*) INTO v_total FROM USER_TABLES
    WHERE TABLE_NAME IN ('T_CONTA_USUARIO', 'MULHER_APOLONIA');
    IF v_total <> 2 THEN
        RAISE_APPLICATION_ERROR(-20004, 'Tabelas esperadas nao encontradas neste schema.');
    END IF;

    -- Preflight: rejeitar definicoes divergentes ANTES do primeiro DDL.
    coluna('USUARIO', 40, FALSE);
    coluna('TIPO_BENEFICIARIO', 30, FALSE);
    coluna('MODO_IDENTIFICACAO', 16, FALSE);
    regra('CK_CONTA_PROGRAMA', c_programa, FALSE);
    regra('CK_CONTA_IDENTIFICACAO', c_identificacao, FALSE);
    regra('CK_CONTA_ACESSO', c_acesso, FALSE);
    SELECT COUNT(*) INTO v_total FROM USER_INDEXES WHERE INDEX_NAME = 'UK_CONTA_USUARIO_LOGIN';
    IF v_total > 0 THEN
        SELECT TABLE_NAME, UNIQUENESS, STATUS INTO v_tabela, v_unico, v_status
        FROM USER_INDEXES WHERE INDEX_NAME = 'UK_CONTA_USUARIO_LOGIN';
        IF v_tabela <> 'T_CONTA_USUARIO' OR v_unico <> 'UNIQUE' OR v_status <> 'VALID' THEN
            RAISE_APPLICATION_ERROR(-20005, 'Revisar indice UK_CONTA_USUARIO_LOGIN.');
        END IF;
        SELECT COUNT(*) INTO v_total FROM USER_IND_COLUMNS WHERE INDEX_NAME = 'UK_CONTA_USUARIO_LOGIN';
        IF v_total <> 1 THEN
            RAISE_APPLICATION_ERROR(-20006, 'Indice de usuario com colunas inesperadas.');
        END IF;
        SELECT COLUMN_EXPRESSION INTO v_expressao FROM USER_IND_EXPRESSIONS
        WHERE INDEX_NAME = 'UK_CONTA_USUARIO_LOGIN' AND COLUMN_POSITION = 1;
        IF NVL(normalizar(v_expressao), '?') <> 'LOWER(USUARIO)' THEN
            RAISE_APPLICATION_ERROR(-20007, 'Revisar expressao do indice de usuario.');
        END IF;
    END IF;

    coluna('USUARIO', 40, TRUE);
    coluna('TIPO_BENEFICIARIO', 30, TRUE);
    coluna('MODO_IDENTIFICACAO', 16, TRUE);
    regra('CK_CONTA_PROGRAMA', c_programa, TRUE);
    regra('CK_CONTA_IDENTIFICACAO', c_identificacao, TRUE);
    regra('CK_CONTA_ACESSO', c_acesso, TRUE);
    SELECT COUNT(*) INTO v_total FROM USER_INDEXES WHERE INDEX_NAME = 'UK_CONTA_USUARIO_LOGIN';
    IF v_total = 0 THEN
        EXECUTE IMMEDIATE 'CREATE UNIQUE INDEX UK_CONTA_USUARIO_LOGIN ON T_CONTA_USUARIO (LOWER(USUARIO))';
    END IF;

    SELECT NULLABLE INTO v_nullable FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'T_CONTA_USUARIO' AND COLUMN_NAME = 'EMAIL';
    IF v_nullable = 'N' THEN
        EXECUTE IMMEDIATE 'ALTER TABLE T_CONTA_USUARIO MODIFY (EMAIL NULL)';
    END IF;

-- NULL significa que a beneficiaria nao respondeu. 0 e 1 mantem seus significados.
-- Nenhum registro historico e reinterpretado ou alterado.
    SELECT NULLABLE INTO v_nullable FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'MULHER_APOLONIA' AND COLUMN_NAME = 'TEM_BOLETIM_OCORRENCIA';
    IF v_nullable = 'N' THEN
        EXECUTE IMMEDIATE 'ALTER TABLE MULHER_APOLONIA MODIFY (TEM_BOLETIM_OCORRENCIA DEFAULT NULL NULL)';
    ELSE
        EXECUTE IMMEDIATE 'ALTER TABLE MULHER_APOLONIA MODIFY (TEM_BOLETIM_OCORRENCIA DEFAULT NULL)';
    END IF;
    DBMS_OUTPUT.PUT_LINE('DDL concluido. Conferir os metadados abaixo. Nenhum DML executado.');
END;
/

-- Verificacao apos execucao autorizada (somente metadados, sem dados pessoais):
SELECT TABLE_NAME, COLUMN_NAME, NULLABLE, DATA_TYPE, DATA_LENGTH
FROM USER_TAB_COLUMNS
WHERE (TABLE_NAME = 'T_CONTA_USUARIO'
       AND COLUMN_NAME IN ('USUARIO', 'EMAIL', 'TIPO_BENEFICIARIO', 'MODO_IDENTIFICACAO'))
   OR (TABLE_NAME = 'MULHER_APOLONIA' AND COLUMN_NAME = 'TEM_BOLETIM_OCORRENCIA');

SELECT CONSTRAINT_NAME, STATUS, VALIDATED FROM USER_CONSTRAINTS
WHERE TABLE_NAME = 'T_CONTA_USUARIO'
  AND CONSTRAINT_NAME IN ('CK_CONTA_PROGRAMA', 'CK_CONTA_IDENTIFICACAO', 'CK_CONTA_ACESSO');
SELECT INDEX_NAME, UNIQUENESS, STATUS FROM USER_INDEXES
WHERE INDEX_NAME = 'UK_CONTA_USUARIO_LOGIN';
