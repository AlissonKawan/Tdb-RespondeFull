# BIBLIOTECAS NECESSÁRIAS

# Instalar Flask:
# pip install flask

# Instalar Flask-CORS:
# pip install flask-cors

# Instalar OracleDB:
# pip install oracledb

# Instalar todas de uma vez:
# pip install flask flask-cors oracledb

# IMPORTS
from flask import Flask, request, jsonify
from flask_cors import CORS
import oracledb

# CONFIGURAÇÃO DO APP
app = Flask(__name__)
CORS(app)

# CONEXÃO COM O ORACLE
def get_connection():
    dsn = oracledb.makedsn(
        host="oracle.fiap.com.br",
        port=1521,
        sid="orcl"
    )
    conn = oracledb.connect(
        user="rm567598",
        password="270906",
        dsn=dsn
    )
    return conn

# HELPERS
def tarefa_to_dict(row, cursor):
    columns = [col[0].lower() for col in cursor.description]
    return dict(zip(columns, row))

# PING
@app.route("/cronograma/ping", methods=["GET"])
def ping():
    return jsonify({
        "status": "ok",
        "mensagem": "API funcionando!"
    }), 200

# CREATE - CADASTRAR TAREFA
@app.route("/cronograma/tarefas", methods=["POST"])
def cadastrar_tarefa():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "erro": "JSON_INVALIDO",
                "mensagem": "JSON não enviado."
            }), 400
        campos_obrigatorios = [
            "voluntario_id",
            "tipo",
            "dia_semana",
            "titulo",
            "status",
            "prioridade"
        ]
        for campo in campos_obrigatorios:
            if not data.get(campo):
                return jsonify({
                    "erro": "VALIDACAO",
                    "mensagem": f"Campo '{campo}' é obrigatório."
                }), 400
        conn = get_connection()
        cursor = conn.cursor()
        id_var = cursor.var(oracledb.NUMBER)
        cursor.execute("""
            INSERT INTO T_TAREFA_CRONOGRAMA
            (
                ID_VOLUNTARIO,
                TIPO,
                DIA_SEMANA,
                TITULO,
                DESCRICAO,
                STATUS,
                PRIORIDADE,
                DATA_ATIVIDADE,
                HORA_INICIO,
                HORA_FIM
            )
            VALUES
            (
                :1,
                :2,
                :3,
                :4,
                :5,
                :6,
                :7,
                :8,
                :9,
                :10
            )
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
        return jsonify({
            "mensagem": "Tarefa cadastrada com sucesso!",
            "id_tarefa": novo_id
        }), 201
    except oracledb.DatabaseError as e:
        return jsonify({
            "erro": "BANCO_DADOS",
            "mensagem": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "erro": "ERRO_INTERNO",
            "mensagem": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# READ - LISTAR TAREFAS
@app.route("/cronograma/tarefas/voluntario/<int:voluntario_id>", methods=["GET"])
def listar_tarefas(voluntario_id):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                ID_TAREFA,
                ID_VOLUNTARIO,
                TIPO,
                DIA_SEMANA,
                TITULO,
                DESCRICAO,
                STATUS,
                PRIORIDADE,
                DATA_ATIVIDADE,
                HORA_INICIO,
                HORA_FIM,
                DATA_CRIACAO,
                DATA_ATUALIZACAO
            FROM T_TAREFA_CRONOGRAMA
            WHERE ID_VOLUNTARIO = :1
            ORDER BY ID_TAREFA
        """, [voluntario_id])
        rows = cursor.fetchall()
        tarefas = []
        for row in rows:
            tarefa = tarefa_to_dict(row, cursor)
            if tarefa.get("data_criacao"):
                tarefa["data_criacao"] = tarefa["data_criacao"].strftime("%Y-%m-%d %H:%M:%S")
            if tarefa.get("data_atualizacao"):
                tarefa["data_atualizacao"] = tarefa["data_atualizacao"].strftime("%Y-%m-%d %H:%M:%S")
            tarefas.append(tarefa)
        return jsonify({
            "voluntario_id": voluntario_id,
            "total": len(tarefas),
            "tarefas": tarefas
        }), 200
    except oracledb.DatabaseError as e:
        return jsonify({
            "erro": "BANCO_DADOS",
            "mensagem": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "erro": "ERRO_INTERNO",
            "mensagem": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# UPDATE
@app.route("/cronograma/tarefas/<int:id_tarefa>", methods=["PUT"])
def atualizar_tarefa(id_tarefa):
    conn = None
    cursor = None
    try:
        data = request.get_json()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE T_TAREFA_CRONOGRAMA
            SET
                TIPO = :1,
                DIA_SEMANA = :2,
                TITULO = :3,
                DESCRICAO = :4,
                STATUS = :5,
                PRIORIDADE = :6,
                DATA_ATIVIDADE = :7,
                HORA_INICIO = :8,
                HORA_FIM = :9,
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
        return jsonify({
            "mensagem": "Tarefa atualizada com sucesso!"
        }), 200
    except oracledb.DatabaseError as e:
        return jsonify({
            "erro": "BANCO_DADOS",
            "mensagem": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "erro": "ERRO_INTERNO",
            "mensagem": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# DELETE
@app.route("/cronograma/tarefas/<int:id_tarefa>", methods=["DELETE"])
def excluir_tarefa(id_tarefa):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM T_TAREFA_CRONOGRAMA
            WHERE ID_TAREFA = :1
        """, [id_tarefa])
        conn.commit()
        return jsonify({
            "mensagem": "Tarefa excluída com sucesso!"
        }), 200
    except oracledb.DatabaseError as e:
        return jsonify({
            "erro": "BANCO_DADOS",
            "mensagem": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "erro": "ERRO_INTERNO",
            "mensagem": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# EXECUÇÃO
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )

# Explicação básica e clara do código .py
"""
Esse código cria uma API REST usando Flask para gerenciar tarefas de um cronograma de voluntários. Ele funciona como um backend que recebe requisições HTTP do front-end (por exemplo React, mobile ou Postman), acessa um banco Oracle e devolve respostas em JSON.

A API possui conexão direta com o banco Oracle da FIAP usando:

host: oracle.fiap.com.br
porta: 1521
SID: orcl
usuário e senha fornecidos

O sistema utiliza a biblioteca oracledb para conversar com o banco Oracle.

O Flask é o framework web responsável por criar as rotas/endpoints da API.

O Flask-CORS libera acesso do front-end, permitindo que aplicações React consigam consumir essa API sem bloqueio de CORS.

O método get_connection() cria uma conexão com o Oracle sempre que alguma operação precisa acessar o banco.

A função tarefa_to_dict() converte os resultados do Oracle em dicionários Python para facilitar a transformação em JSON.

A API possui vários endpoints:

O endpoint /cronograma/ping
serve apenas para testar se a API está funcionando. Quando acessado, retorna uma mensagem indicando que o servidor está online.

O endpoint POST /cronograma/tarefas
cadastra uma nova tarefa no banco.

Ele recebe um JSON contendo informações como:

ID do voluntário
tipo da tarefa
dia da semana
título
descrição
status
prioridade
horário

O código valida se os campos obrigatórios foram enviados.

Depois abre conexão com o Oracle e executa um INSERT na tabela T_TAREFA_CRONOGRAMA.

Após inserir os dados, ele faz commit da transação e devolve:

mensagem de sucesso
ID da nova tarefa criada

O endpoint GET /cronograma/tarefas/voluntario/<id>
lista todas as tarefas de um voluntário específico.

Ele faz um SELECT no Oracle filtrando pelo ID do voluntário.

Os resultados são convertidos para JSON e retornados para o front-end.

O endpoint PUT /cronograma/tarefas/<id>
atualiza uma tarefa existente.

Ele recebe novos dados em JSON e executa um UPDATE no banco.

Também atualiza automaticamente a coluna DATA_ATUALIZACAO usando CURRENT_TIMESTAMP.

O endpoint DELETE /cronograma/tarefas/<id>
remove uma tarefa do banco.

Ele executa um DELETE na tabela usando o ID da tarefa.

O código possui tratamento de erros usando try/except.

Se ocorrer erro de banco Oracle:

retorna erro BANCO_DADOS

Se ocorrer erro geral:

retorna erro ERRO_INTERNO

O bloco finally
garante que cursor e conexão sejam fechados corretamente mesmo em caso de erro, evitando vazamento de conexões.

No final do código existe:

if __name__ == "__main__":

Isso inicia o servidor Flask localmente na porta 5000.

Quando executado:

a API sobe
começa a escutar requisições HTTP
permite operações CRUD completas:
CREATE
READ
UPDATE
DELETE

Na prática, esse sistema funciona como um backend completo de gerenciamento de tarefas semanais para voluntários, integrado ao Oracle Database.
"""
