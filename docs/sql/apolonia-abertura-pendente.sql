-- MANUAL SOMENTE. Não executar no startup. Oracle / SQL*Plus, schema da aplicação.
-- Janela sem escritas; DBA deve obter backup consistente e export de metadados ANTES.
-- DDL Oracle faz commit implícito: ROLLBACK não desfaz ALTER TABLE.
WHENEVER SQLERROR EXIT FAILURE ROLLBACK
SET SERVEROUTPUT ON
-- PRECHECK: capturar estes metadados no registro restrito de implantação, sem relatos/identidades.
SELECT table_name, column_name, nullable, data_default
FROM user_tab_columns WHERE (table_name='MULHER_APOLONIA' AND column_name IN ('NIVEL_RISCO','TEM_BOLETIM_OCORRENCIA'))
 OR (table_name='ATENDIMENTO' AND column_name='PRIORIDADE');
SELECT c.table_name,c.constraint_name,c.constraint_type,c.search_condition
FROM user_constraints c WHERE c.table_name IN ('MULHER_APOLONIA','ATENDIMENTO','PESSOA_ATENDIDA');
-- PARAR se houver defaults fictícios, checks NOT NULL separados ou schema divergente;
-- não remover constraints às cegas.
DECLARE n NUMBER;
BEGIN
 SELECT COUNT(*) INTO n FROM (SELECT id_conta FROM pessoa_atendida WHERE id_conta IS NOT NULL GROUP BY id_conta HAVING COUNT(*)>1);
 IF n>0 THEN raise_application_error(-20001,'Vinculos duplicados: revisao manual sem apagar historico'); END IF;
END;
/
-- BACKUP: executar export Data Pump consistente de schema/metadados por DBA, com restauração ensaiada.
-- Registrar SCN e validar leitura/restore. Não copiar dados sensíveis para repositório/logs.
-- CONFIRMAÇÃO HUMANA OBRIGATÓRIA: só continuar após preflight e backup aprovados.
PAUSE Confirme preflight e backup antes de continuar (Ctrl+C cancela)
ALTER TABLE MULHER_APOLONIA MODIFY (NIVEL_RISCO NULL, TEM_BOLETIM_OCORRENCIA NULL);
ALTER TABLE ATENDIMENTO MODIFY (PRIORIDADE NULL);
-- Unicidade do vínculo de conta existente; contas sem vínculo continuam permitidas.
DECLARE n NUMBER;
BEGIN
 SELECT COUNT(*) INTO n FROM user_indexes i WHERE i.table_name='PESSOA_ATENDIDA' AND i.uniqueness='UNIQUE'
 AND (SELECT COUNT(*) FROM user_ind_columns c WHERE c.index_name=i.index_name)=1
 AND EXISTS (SELECT 1 FROM user_ind_columns c WHERE c.index_name=i.index_name AND c.column_name='ID_CONTA');
 IF n=0 THEN EXECUTE IMMEDIATE 'CREATE UNIQUE INDEX UX_PESSOA_CONTA_ABERTURA ON PESSOA_ATENDIDA(ID_CONTA)';
 ELSE DBMS_OUTPUT.PUT_LINE('Unicidade existente preservada; nenhum indice criado.'); END IF;
END;
/
-- Não há UPDATE/DELETE: valores históricos permanecem intactos.
-- Pós-check: as 3 colunas devem ser nullable e índice VALID/UNIQUE.
SELECT table_name,column_name,nullable FROM user_tab_columns WHERE
 (table_name='MULHER_APOLONIA' AND column_name IN ('NIVEL_RISCO','TEM_BOLETIM_OCORRENCIA'))
 OR (table_name='ATENDIMENTO' AND column_name='PRIORIDADE');
SELECT index_name,uniqueness,status FROM user_indexes WHERE index_name='UX_PESSOA_CONTA_ABERTURA';
-- ROLLBACK MANUAL (não executado por este arquivo):
-- 1. suspender escritas e reverter aplicação; guardar dados novos e backup atualizado.
-- 2. SELECT COUNT(*) FROM MULHER_APOLONIA WHERE NIVEL_RISCO IS NULL OR TEM_BOLETIM_OCORRENCIA IS NULL;
--    SELECT COUNT(*) FROM ATENDIMENTO WHERE PRIORIDADE IS NULL;
-- 3. Se qualquer contagem >0, NÃO preencher 0/false/3 nem apagar: manter schema permissivo
--    e corrigir aplicação, ou restauração coordenada pelo DBA com preservação dos pedidos novos.
-- 4. Apenas se não houver NULLs e o preflight original provar NOT NULL:
--    ALTER TABLE MULHER_APOLONIA MODIFY (NIVEL_RISCO NOT NULL, TEM_BOLETIM_OCORRENCIA NOT NULL);
--    ALTER TABLE ATENDIMENTO MODIFY (PRIORIDADE NOT NULL);
-- 5. DROP INDEX UX_PESSOA_CONTA_ABERTURA; -- somente se criado por esta entrega e sem dependências.
-- Restaurar os metadados exatos do backup se estado anterior era diferente.
