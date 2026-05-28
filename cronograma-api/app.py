"""
====================================================
API REST - CRONOGRAMA DE TAREFAS - TDB RESPONDE
Framework: Flask + cx_Oracle
Deploy: Render.com
====================================================
"""

import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import oracledb

app = Flask(__name__)
CORS(app)  # Permite requisições do front-end React

# ============================================================
# CONEXÃO COM ORACLE
# ============================================================

def get_connection():
    """Retorna uma conexão com o banco Oracle via variáveis de ambiente."""
    dsn = oracledb.makedsn(
        host=os.environ.get("DB_HOST", "oracle.fiap.com.br"),
        port=int(os.environ.get("DB_PORT", 1521)),
        sid=os.environ.get("DB_SID", "orcl")
    )
    conn = oracledb.connect(
        user=os.environ.get("DB_USERNAME"),
        password=os.environ.get("DB_PASSWORD"),
        dsn=dsn
    )
    return conn


def tarefa_to_dict(row, cursor):
    """Converte uma linha do Oracle em dicionário Python."""
    columns = [col[0].lower() for col in cursor.description]
    return dict(zip(columns, row))


# ============================================================
# ENDPOINTS
# ============================================================

# --- PING ---
@app.route("/cronograma/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "mensagem": "API Cronograma TDB Responde rodando!"}), 200


# --- CREATE: Cadastrar nova tarefa ---
@app.route("/cronograma/tarefas", methods=["POST"])
def cadastrar_tarefa():
    """
    Body JSON esperado:
    {
        "voluntario_id": 1,
        "tipo": "Consulta",
        "dia_semana": "Segunda-feira",
        "titulo": "Atendimento odontológico",
        "descricao": "Atender paciente João",
        "status": "Pendente",
        "prioridade": "Alta",
        "data_atividade": "26/05/2026",
        "hora_inicio": "09:00",
        "hora_fim": "10:00"
    }
    """
    try:
        data = request.get_json()

        # Validações obrigatórias
        campos_obrigatorios = ["voluntario_id", "tipo", "dia_semana", "titulo", "status", "prioridade"]
        for campo in campos_obrigatorios:
            if not data.get(campo):
                return jsonify({"erro": "VALIDACAO", "mensagem": f"Campo '{campo}' é obrigatório."}), 400

        dias_validos = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"]
        if data["dia_semana"] not in dias_validos:
            return jsonify({"erro": "VALIDACAO", "mensagem": f"Dia da semana inválido. Use: {dias_validos}"}), 400

        status_validos = ["Pendente", "Em andamento", "Concluida", "Cancelada", "Atrasada"]
        if data["status"] not in status_validos:
            return jsonify({"erro": "VALIDACAO", "mensagem": f"Status inválido. Use: {status_validos}"}), 400

        prioridades_validas = ["Baixa", "Media", "Alta", "Urgente"]
        if data["prioridade"] not in prioridades_validas:
            return jsonify({"erro": "VALIDACAO", "mensagem": f"Prioridade inválida. Use: {prioridades_validas}"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        id_var = cursor.var(oracledb.NUMBER)

        cursor.execute("""
            INSERT INTO T_TAREFA_CRONOGRAMA
                (ID_VOLUNTARIO, TIPO, DIA_SEMANA, TITULO, DESCRICAO, STATUS, PRIORIDADE, DATA_ATIVIDADE, HORA_INICIO, HORA_FIM)
            VALUES
                (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10)
            RETURNING ID_TAREFA INTO :11
        """, [
            data["voluntario_id"],
            data["tipo"],
            data["dia_semana"],
            data["titulo"],
            data.get("descricao", ""),
            data["status"],
            data["prioridade"],
            data.get("data_atividade", ""),
            data.get("hora_inicio", ""),
            data.get("hora_fim", ""),
            id_var
        ])
        conn.commit()

        novo_id = int(id_var.getvalue()[0])
        cursor.close()
        conn.close()

        return jsonify({
            "mensagem": "Tarefa cadastrada com sucesso!",
            "id_tarefa": novo_id
        }), 201

    except oracledb.DatabaseError as e:
        return jsonify({"erro": "BANCO_DADOS", "mensagem": str(e)}), 500
    except Exception as e:
        return jsonify({"erro": "ERRO_INTERNO", "mensagem": str(e)}), 500


# --- READ: Listar todas as tarefas de um voluntário ---
@app.route("/cronograma/tarefas/voluntario/<int:voluntario_id>", methods=["GET"])
def listar_tarefas_voluntario(voluntario_id):
    """
    Query params opcionais:
      ?dia_semana=Segunda-feira
      ?status=Pendente
      ?prioridade=Alta
    """
    try:
        dia_semana = request.args.get("dia_semana")
        status = request.args.get("status")
        prioridade = request.args.get("prioridade")

        conn = get_connection()
        cursor = conn.cursor()

        query = """
            SELECT ID_TAREFA, ID_VOLUNTARIO, TIPO, DIA_SEMANA, TITULO, DESCRICAO,
                   STATUS, PRIORIDADE, DATA_ATIVIDADE, HORA_INICIO, HORA_FIM,
                   DATA_CRIACAO, DATA_ATUALIZACAO
            FROM T_TAREFA_CRONOGRAMA
            WHERE ID_VOLUNTARIO = :1
        """
        params = [voluntario_id]

        if dia_semana:
            query += " AND DIA_SEMANA = :2"
            params.append(dia_semana)
        if status:
            query += f" AND STATUS = :{len(params) + 1}"
            params.append(status)
        if prioridade:
            query += f" AND PRIORIDADE = :{len(params) + 1}"
            params.append(prioridade)

        query += " ORDER BY CASE DIA_SEMANA WHEN 'Domingo' THEN 1 WHEN 'Segunda-feira' THEN 2 WHEN 'Terca-feira' THEN 3 WHEN 'Quarta-feira' THEN 4 WHEN 'Quinta-feira' THEN 5 WHEN 'Sexta-feira' THEN 6 WHEN 'Sabado' THEN 7 END, HORA_INICIO"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        tarefas = []
        for row in rows:
            t = tarefa_to_dict(row, cursor)
            # Formata datas para string
            if t.get("data_criacao"):
                t["data_criacao"] = t["data_criacao"].strftime("%Y-%m-%dT%H:%M:%S")
            if t.get("data_atualizacao"):
                t["data_atualizacao"] = t["data_atualizacao"].strftime("%Y-%m-%dT%H:%M:%S")
            tarefas.append(t)

        cursor.close()
        conn.close()

        return jsonify({
            "voluntario_id": voluntario_id,
            "total": len(tarefas),
            "tarefas": tarefas
        }), 200

    except oracledb.DatabaseError as e:
        return jsonify({"erro": "BANCO_DADOS", "mensagem": str(e)}), 500
    except Exception as e:
        return jsonify({"erro": "ERRO_INTERNO", "mensagem": str(e)}), 500


# --- READ: Buscar uma tarefa por ID ---
@app.route("/cronograma/tarefas/<int:id_tarefa>", methods=["GET"])
def buscar_tarefa(id_tarefa):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT ID_TAREFA, ID_VOLUNTARIO, TIPO, DIA_SEMANA, TITULO, DESCRICAO,
                   STATUS, PRIORIDADE, DATA_ATIVIDADE, HORA_INICIO, HORA_FIM,
                   DATA_CRIACAO, DATA_ATUALIZACAO
            FROM T_TAREFA_CRONOGRAMA
            WHERE ID_TAREFA = :1
        """, [id_tarefa])

        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return jsonify({"erro": "NAO_ENCONTRADO", "mensagem": f"Tarefa {id_tarefa} não encontrada."}), 404

        tarefa = tarefa_to_dict(row, cursor)
        if tarefa.get("data_criacao"):
            tarefa["data_criacao"] = tarefa["data_criacao"].strftime("%Y-%m-%dT%H:%M:%S")
        if tarefa.get("data_atualizacao"):
            tarefa["data_atualizacao"] = tarefa["data_atualizacao"].strftime("%Y-%m-%dT%H:%M:%S")

        cursor.close()
        conn.close()

        return jsonify(tarefa), 200

    except oracledb.DatabaseError as e:
        return jsonify({"erro": "BANCO_DADOS", "mensagem": str(e)}), 500
    except Exception as e:
        return jsonify({"erro": "ERRO_INTERNO", "mensagem": str(e)}), 500


# --- UPDATE: Alterar uma tarefa ---
@app.route("/cronograma/tarefas/<int:id_tarefa>", methods=["PUT"])
def alterar_tarefa(id_tarefa):
    """
    Mesmo body JSON do cadastro (todos os campos).
    """
    try:
        data = request.get_json()

        campos_obrigatorios = ["tipo", "dia_semana", "titulo", "status", "prioridade"]
        for campo in campos_obrigatorios:
            if not data.get(campo):
                return jsonify({"erro": "VALIDACAO", "mensagem": f"Campo '{campo}' é obrigatório."}), 400

        conn = get_connection()
        cursor = conn.cursor()

        # Verifica se a tarefa existe
        cursor.execute("SELECT ID_TAREFA FROM T_TAREFA_CRONOGRAMA WHERE ID_TAREFA = :1", [id_tarefa])
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"erro": "NAO_ENCONTRADO", "mensagem": f"Tarefa {id_tarefa} não encontrada."}), 404

        cursor.execute("""
            UPDATE T_TAREFA_CRONOGRAMA SET
                TIPO             = :1,
                DIA_SEMANA       = :2,
                TITULO           = :3,
                DESCRICAO        = :4,
                STATUS           = :5,
                PRIORIDADE       = :6,
                DATA_ATIVIDADE   = :7,
                HORA_INICIO      = :8,
                HORA_FIM         = :9,
                DATA_ATUALIZACAO = CURRENT_TIMESTAMP
            WHERE ID_TAREFA = :10
        """, [
            data["tipo"],
            data["dia_semana"],
            data["titulo"],
            data.get("descricao", ""),
            data["status"],
            data["prioridade"],
            data.get("data_atividade", ""),
            data.get("hora_inicio", ""),
            data.get("hora_fim", ""),
            id_tarefa
        ])
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"mensagem": "Tarefa atualizada com sucesso!", "id_tarefa": id_tarefa}), 200

    except oracledb.DatabaseError as e:
        return jsonify({"erro": "BANCO_DADOS", "mensagem": str(e)}), 500
    except Exception as e:
        return jsonify({"erro": "ERRO_INTERNO", "mensagem": str(e)}), 500


# --- DELETE: Excluir uma tarefa ---
@app.route("/cronograma/tarefas/<int:id_tarefa>", methods=["DELETE"])
def excluir_tarefa(id_tarefa):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT ID_TAREFA FROM T_TAREFA_CRONOGRAMA WHERE ID_TAREFA = :1", [id_tarefa])
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"erro": "NAO_ENCONTRADO", "mensagem": f"Tarefa {id_tarefa} não encontrada."}), 404

        cursor.execute("DELETE FROM T_TAREFA_CRONOGRAMA WHERE ID_TAREFA = :1", [id_tarefa])
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"mensagem": "Tarefa excluída com sucesso!", "id_tarefa": id_tarefa}), 200

    except oracledb.DatabaseError as e:
        return jsonify({"erro": "BANCO_DADOS", "mensagem": str(e)}), 500
    except Exception as e:
        return jsonify({"erro": "ERRO_INTERNO", "mensagem": str(e)}), 500


# --- EXTRA: Resumo semanal por dia ---
@app.route("/cronograma/tarefas/voluntario/<int:voluntario_id>/resumo", methods=["GET"])
def resumo_semanal(voluntario_id):
    """Retorna contagem de tarefas por dia da semana para o voluntário."""
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DIA_SEMANA, STATUS, COUNT(*) AS TOTAL
            FROM T_TAREFA_CRONOGRAMA
            WHERE ID_VOLUNTARIO = :1
            GROUP BY DIA_SEMANA, STATUS
            ORDER BY
                CASE DIA_SEMANA
                    WHEN 'Domingo' THEN 1 WHEN 'Segunda-feira' THEN 2
                    WHEN 'Terca-feira' THEN 3 WHEN 'Quarta-feira' THEN 4
                    WHEN 'Quinta-feira' THEN 5 WHEN 'Sexta-feira' THEN 6
                    WHEN 'Sabado' THEN 7
                END
        """, [voluntario_id])

        rows = cursor.fetchall()
        resumo = {}
        for row in rows:
            dia, status, total = row
            if dia not in resumo:
                resumo[dia] = {}
            resumo[dia][status] = total

        cursor.close()
        conn.close()

        return jsonify({"voluntario_id": voluntario_id, "resumo": resumo}), 200

    except oracledb.DatabaseError as e:
        return jsonify({"erro": "BANCO_DADOS", "mensagem": str(e)}), 500
    except Exception as e:
        return jsonify({"erro": "ERRO_INTERNO", "mensagem": str(e)}), 500


# ============================================================
# INICIALIZAÇÃO
# ============================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
