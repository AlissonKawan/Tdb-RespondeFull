# Flask: framework web do Python que cria o servidor e gerencia as rotas (endpoints)
# request: objeto que representa a requisição recebida (contém o JSON enviado pelo cliente)
# jsonify: converte dicionários Python em respostas JSON para o cliente
from flask import Flask, request, jsonify

# CORS: permite que páginas web de outros domínios chamem esta API
# Sem isso, o navegador bloquearia chamadas vindas do frontend React
from flask_cors import CORS

# joblib: carrega o modelo treinado que foi salvo em disco pelo notebook
import joblib

# pandas: usado para montar o DataFrame de entrada antes de chamar o modelo
import pandas as pd

# traceback: captura o rastro completo do erro quando algo dá errado,
# facilitando a identificação do problema
import traceback

# Cria a aplicação Flask — é o coração do servidor
app = Flask(__name__)

# Habilita o CORS para todos os endpoints da aplicação
# Isso permite que o frontend React (que roda em outra porta) chame a API sem bloqueio
CORS(app)

# ─────────────────────────────────────────────────────────────────────────────
# CARREGAMENTO DO MODELO
# Executado uma única vez quando o servidor inicia
# ─────────────────────────────────────────────────────────────────────────────

# Carrega o arquivo .joblib gerado pelo notebook
# O arquivo contém um dicionário com a pipeline, o label_encoder e o nome do modelo
pacote = joblib.load("modelo_tdb.joblib")

# Extrai a pipeline completa do pacote (preprocessador + classificador)
pipeline = pacote["pipeline"]

# Extrai o LabelEncoder — só existe se o modelo vencedor foi XGBoost
# Para outros modelos (Random Forest, SVM, etc.) esse valor é None
label_encoder = pacote.get("label_encoder")

# Extrai o nome do modelo vencedor (ex: "Random Forest") para exibir no /health
# Se por algum motivo a chave não existir, usa "desconhecido" como padrão
modelo_nome = pacote.get("modelo_nome", "desconhecido")

# Confirma no terminal que o modelo foi carregado com sucesso
print(f"Modelo carregado: {modelo_nome}")

# Tenta carregar o modelo de check-in (se já foi treinado)
try:
    pacote_checkin = joblib.load("modelo_checkin.joblib")
    pipeline_checkin = pacote_checkin["pipeline"]
    modelo_checkin_nome = pacote_checkin.get("modelo_nome", "desconhecido")
    print(f"Modelo Check-in carregado: {modelo_checkin_nome}")
except FileNotFoundError:
    pipeline_checkin = None
    modelo_checkin_nome = "Não treinado"
    print("Aviso: modelo_checkin.joblib não encontrado. Execute o treinador_automatico.py antes.")


# ─────────────────────────────────────────────────────────────────────────────
# LISTAS DE VALORES VÁLIDOS
# Espelham exatamente os valores aceitos pelo sistema Java TDB Responde
# Se o cliente enviar um valor fora dessas listas, a API retorna erro 400
# ─────────────────────────────────────────────────────────────────────────────

# Canais de comunicação disponíveis no sistema Java (CanalComunicacao.nome)
CANAIS_VALIDOS = ["email", "whatsapp", "telefone", "presencial"]

# Status possíveis de um atendimento (Atendimento.status)
STATUS_VALIDOS = ["ABERTO", "EM_ATENDIMENTO", "ENCERRADO", "SOLICITADO"]

# Quem pode enviar uma mensagem (Mensagem.enviadoPor)
ENVIADO_POR_VALIDOS = ["VOLUNTARIO", "BENEFICIARIO", "PESSOA_ATENDIDA"]

# Tipos de pessoa atendida (PessoaAtendida.tipo)
TIPO_PESSOA_VALIDOS = ["CRIANCA_ADOLESCENTE", "MULHER_APOLONIA", "OUTRO"]


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT /health  —  método GET
# ─────────────────────────────────────────────────────────────────────────────

# O decorador @app.route define a URL e o método HTTP aceito por essa função
# Quando alguém acessa GET http://localhost:5000/health, o Flask chama health()
@app.route("/health", methods=["GET"])
def health():
    # Retorna um JSON simples confirmando que o servidor está no ar
    # O segundo valor (200) é o código HTTP de sucesso
    return jsonify({
        "status":  "ok",                                        # Indica que o serviço está ativo
        "servico": "TDB Responde — Classificador de Mensagens", # Nome do serviço
        "modelo":  modelo_nome,                                 # Nome do modelo carregado
        "modelo_checkin": modelo_checkin_nome,                  # Nome do modelo de checkin
        "versao":  "1.0.0"                                      # Versão da API
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT /predict  —  método POST
# ─────────────────────────────────────────────────────────────────────────────

# Quando alguém envia POST http://localhost:5000/predict com um JSON no corpo,
# o Flask chama a função predict()
@app.route("/predict", methods=["POST"])
def predict():
    """
    Classifica uma mensagem automaticamente.

    Corpo da requisição (JSON):
    {
        "conteudo":               "texto da mensagem",
        "enviado_por":            "VOLUNTARIO" | "BENEFICIARIO" | "PESSOA_ATENDIDA",
        "canal":                  "email" | "whatsapp" | "telefone" | "presencial",
        "prioridade_atendimento": 1 | 2 | 3 | 4,
        "status_atendimento":     "ABERTO" | "EM_ATENDIMENTO" | "ENCERRADO" | "SOLICITADO",
        "tipo_pessoa":            "CRIANCA_ADOLESCENTE" | "MULHER_APOLONIA" | "OUTRO",
        "gravidade":              1 a 5
    }

    Resposta:
    {
        "categoria_prevista": "urgencia",
        "probabilidades":     { "elogio": 0.02, "urgencia": 0.84, ... },
        "confianca":          0.84
    }
    """

    # try/except: se qualquer erro acontecer dentro do bloco try,
    # o código vai para o except sem derrubar o servidor
    try:

        # Lê o JSON enviado no corpo da requisição e transforma em dicionário Python
        dados = request.get_json()

        # Se o corpo estiver vazio ou não for um JSON válido, retorna erro 400
        if not dados:
            return jsonify({"erro": "Corpo da requisição vazio ou não é JSON"}), 400

        # ── Validação dos campos obrigatórios ────────────────────────────────

        # Lista com os nomes de todos os campos que precisam estar presentes no JSON
        campos_obrigatorios = [
            "conteudo", "enviado_por", "canal",
            "prioridade_atendimento", "status_atendimento",
            "tipo_pessoa", "gravidade"
        ]

        # Percorre cada campo obrigatório e verifica se ele existe no JSON recebido
        for campo in campos_obrigatorios:
            if campo not in dados:
                # Se algum campo estiver faltando, retorna erro 400 informando qual campo
                return jsonify({"erro": f"Campo obrigatório ausente: {campo}"}), 400

        # ── Validação dos valores ────────────────────────────────────────────

        # Verifica se o canal enviado é um dos valores aceitos pelo sistema Java
        if dados["canal"] not in CANAIS_VALIDOS:
            return jsonify({"erro": f"Canal inválido. Use um de: {CANAIS_VALIDOS}"}), 400

        # Verifica se o status do atendimento é um dos valores aceitos
        if dados["status_atendimento"] not in STATUS_VALIDOS:
            return jsonify({"erro": f"Status inválido. Use um de: {STATUS_VALIDOS}"}), 400

        # Verifica se o remetente da mensagem é um dos valores aceitos
        if dados["enviado_por"] not in ENVIADO_POR_VALIDOS:
            return jsonify({"erro": f"enviado_por inválido. Use um de: {ENVIADO_POR_VALIDOS}"}), 400

        # Verifica se o tipo de pessoa é um dos valores aceitos
        if dados["tipo_pessoa"] not in TIPO_PESSOA_VALIDOS:
            return jsonify({"erro": f"tipo_pessoa inválido. Use um de: {TIPO_PESSOA_VALIDOS}"}), 400

        # Verifica se a prioridade está entre 1 e 4 (conforme o sistema Java)
        # int() converte o valor para inteiro antes de comparar, evitando erros de tipo
        if not (1 <= int(dados["prioridade_atendimento"]) <= 4):
            return jsonify({"erro": "prioridade_atendimento deve ser entre 1 e 4"}), 400

        # Verifica se a gravidade está entre 1 e 5
        if not (1 <= int(dados["gravidade"]) <= 5):
            return jsonify({"erro": "gravidade deve ser entre 1 e 5"}), 400

        # ── Montagem do DataFrame de entrada ────────────────────────────────

        # O modelo foi treinado com um DataFrame do pandas,
        # então a predição também precisa receber um DataFrame no mesmo formato
        # O colchete duplo [{ }] cria um DataFrame com uma única linha
        entrada = pd.DataFrame([{
            "conteudo":               str(dados["conteudo"]),                   # Garante que é texto
            "enviado_por":            dados["enviado_por"],
            "canal":                  dados["canal"],
            "prioridade_atendimento": int(dados["prioridade_atendimento"]),     # Garante que é inteiro
            "status_atendimento":     dados["status_atendimento"],
            "tipo_pessoa":            dados["tipo_pessoa"],
            "gravidade":              int(dados["gravidade"])                   # Garante que é inteiro
        }])

        # ── Predição ─────────────────────────────────────────────────────────

        # Passa o DataFrame pela pipeline (preprocessa e classifica)
        # [0] pega o primeiro (e único) resultado, já que só enviamos uma linha
        pred_raw = pipeline.predict(entrada)[0]

        # Retorna as probabilidades de cada categoria para aquela mensagem
        # Ex: [0.02, 0.03, 0.05, 0.01, 0.89] — uma probabilidade por categoria
        probabilidades = pipeline.predict_proba(entrada)[0]

        # ── Conversão do resultado ───────────────────────────────────────────

        # Se o modelo foi XGBoost, pred_raw é um número (ex: 4)
        # O LabelEncoder converte de volta para o nome da categoria (ex: "urgencia")
        if label_encoder is not None:
            categoria = label_encoder.inverse_transform([pred_raw])[0]
            classes   = label_encoder.classes_   # Nomes das categorias na ordem correta
        else:
            # Para Random Forest, SVM e Regressão Logística, pred_raw já é o nome da categoria
            categoria = pred_raw
            classes   = pipeline.classes_        # Nomes das categorias na ordem correta

        # Monta o dicionário de probabilidades: {"elogio": 0.02, "urgencia": 0.84, ...}
        # zip() combina os nomes das classes com suas respectivas probabilidades
        # round(..., 4) arredonda para 4 casas decimais
        # float() converte de numpy float para float nativo do Python (necessário para o JSON)
        prob_dict = {
            cls: round(float(prob), 4)
            for cls, prob in zip(classes, probabilidades)
        }

        # ── Retorno da resposta ──────────────────────────────────────────────

        # Retorna o JSON com o resultado da classificação
        # max(probabilidades) pega a maior probabilidade — é o índice de confiança
        return jsonify({
            "categoria_prevista": categoria,                              # Ex: "urgencia"
            "probabilidades":     prob_dict,                             # Ex: {"urgencia": 0.84, ...}
            "confianca":          round(float(max(probabilidades)), 4)   # Ex: 0.84
        }), 200  # Código HTTP 200 = sucesso

    # ── Tratamento de erros ──────────────────────────────────────────────────

    # Se qualquer erro inesperado acontecer no bloco try, cai aqui
    # O servidor não derruba — responde com erro 500 e os detalhes do problema
    except Exception as e:
        return jsonify({
            "erro":      "Erro interno no servidor",  # Mensagem genérica para o cliente
            "detalhe":   str(e),                      # Descrição do erro
            "traceback": traceback.format_exc()        # Rastro completo do erro para debug
        }), 500  # Código HTTP 500 = erro interno do servidor


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT /predict_checkin  —  método POST
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/predict_checkin", methods=["POST"])
def predict_checkin():
    try:
        if pipeline_checkin is None:
            return jsonify({"erro": "Modelo de check-in não está treinado ainda"}), 503

        dados = request.get_json()
        if not dados:
            return jsonify({"erro": "Corpo da requisição vazio"}), 400

        campos_req = ["tipo_pessoa", "canal", "gravidade", "risco", "prioridade"]
        for c in campos_req:
            if c not in dados:
                return jsonify({"erro": f"Faltando campo: {c}"}), 400

        entrada = pd.DataFrame([{
            "TIPO_PESSOA": str(dados["tipo_pessoa"]),
            "CANAL": str(dados["canal"]),
            "STATUS_ATENDIMENTO": str(dados.get("status_atendimento", "ABERTO")),
            "GRAVIDADE": int(dados["gravidade"]),
            "RISCO": int(dados["risco"]),
            "PRIORIDADE": int(dados["prioridade"])
        }])

        pred_cat = pipeline_checkin.predict(entrada)[0]
        probabilidades = pipeline_checkin.predict_proba(entrada)[0]
        classes = pipeline_checkin.classes_

        prob_dict = {
            cls: round(float(prob), 4)
            for cls, prob in zip(classes, probabilidades)
        }

        return jsonify({
            "previsao_checkin": pred_cat,
            "probabilidades": prob_dict,
            "confianca": round(float(max(probabilidades)), 4)
        }), 200

    except Exception as e:
        return jsonify({
            "erro": "Erro ao prever check-in",
            "detalhe": str(e),
            "traceback": traceback.format_exc()
        }), 500



# ─────────────────────────────────────────────────────────────────────────────
# INICIALIZAÇÃO DO SERVIDOR
# ─────────────────────────────────────────────────────────────────────────────

# Esse bloco só executa quando o arquivo é rodado diretamente (python app.py)
# Se o app.py fosse importado por outro arquivo, esse bloco seria ignorado
if __name__ == "__main__":

    # Exibe no terminal as informações de acesso ao servidor
    print("=" * 55)
    print("  TDB Responde — API de Classificação de Mensagens")
    print("  Health:  http://localhost:5000/health")
    print("  Predict: http://localhost:5000/predict  [POST]")
    print("  Check-in: http://localhost:5000/predict_checkin [POST]")
    print("=" * 55)

    # Inicia o servidor Flask com as seguintes configurações:
    # debug=True: reinicia automaticamente quando o código é alterado e mostra erros detalhados
    # host="0.0.0.0": aceita conexões de qualquer endereço (não só localhost)
    # port=5000: porta onde o servidor vai escutar as requisições
    app.run(debug=True, host="0.0.0.0", port=5000)