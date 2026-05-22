import os
import joblib
import pandas as pd
import numpy as np
import oracledb
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Canais reais mapeados do Oracle (ajuste caso mude no banco)
MAPA_CANAL = {
    "Sistema Web": "sistema_web",
    "WhatsApp": "whatsapp",
    "Email": "email",
}

TIPOS_VALIDOS = ["CRIANCA_ADOLESCENTE", "MULHER_APOLONIA", "OUTRO"]
CANAIS_VALIDOS = ["sistema_web", "whatsapp", "email", "presencial"]
STATUS_CHECKIN_TARGET = ["CONFIRMADO", "NAO_COMPARECERA", "REAGENDAMENTO_SOLICITADO", "SEM_RESPOSTA"]


def gerar_dados_ficticios(qtd=600):
    print(f"  Gerando {qtd} registros fictícios para enriquecer o treino...")
    np.random.seed(42)

    dados = []
    for _ in range(qtd):
        tipo = np.random.choice(TIPOS_VALIDOS, p=[0.4, 0.4, 0.2])
        canal = np.random.choice(CANAIS_VALIDOS)
        gravidade = np.random.randint(1, 6)
        risco = np.random.randint(1, 6) if tipo == "MULHER_APOLONIA" else 0
        prioridade = np.random.randint(1, 5)
        status_atendimento = np.random.choice(["ABERTO", "EM_ATENDIMENTO", "ENCERRADO"])

        # Lógica de negócio realista para gerar o target
        # Urgência alta + canal whatsapp = mais chance de confirmar
        chance_confirmar = 0.40
        if prioridade == 1:
            chance_confirmar += 0.25
        elif prioridade == 2:
            chance_confirmar += 0.15
        if gravidade >= 4 or risco >= 4:
            chance_confirmar += 0.10
        if canal == "whatsapp":
            chance_confirmar += 0.10
        if canal == "presencial":
            chance_confirmar += 0.05

        r = np.random.rand()
        if r < chance_confirmar:
            status = "CONFIRMADO"
        elif r < chance_confirmar + 0.22:
            status = "NAO_COMPARECERA"
        elif r < chance_confirmar + 0.32:
            status = "REAGENDAMENTO_SOLICITADO"
        else:
            status = "SEM_RESPOSTA"

        dados.append({
            "TIPO_PESSOA": tipo,
            "CANAL": canal,
            "GRAVIDADE": gravidade,
            "RISCO": risco,
            "PRIORIDADE": prioridade,
            "STATUS_ATENDIMENTO": status_atendimento,
            "STATUS_CHECKIN": status
        })

    return pd.DataFrame(dados)


def conectar_oracle():
    print("  Conectando ao Oracle...")
    user = os.environ.get("DB_USERNAME", "SEU_RM")
    pwd = os.environ.get("DB_PASSWORD", "SUA_SENHA")
    dsn = os.environ.get("DB_DSN", "oracle.fiap.com.br:1521/orcl")

    try:
        connection = oracledb.connect(user=user, password=pwd, dsn=dsn)
        print("  Conexão estabelecida com sucesso!")
        return connection
    except Exception as e:
        print(f"  Falha na conexão: {e}")
        return None


def buscar_dados_reais(conn):
    query = """
        SELECT
            P.TIPO AS TIPO_PESSOA,
            C.NOME AS CANAL,
            NVL(CA.GRAVIDADE_BUCAL, 0) AS GRAVIDADE,
            NVL(MA.NIVEL_RISCO, 0) AS RISCO,
            A.PRIORIDADE,
            A.STATUS AS STATUS_ATENDIMENTO,
            A.STATUS_CHECKIN
        FROM ATENDIMENTO A
        JOIN PESSOA_ATENDIDA P ON A.PESSOA_ATENDIDA_ID = P.ID
        JOIN CANAL_COMUNICACAO C ON A.CANAL_COMUNICACAO_ID = C.ID
        LEFT JOIN CRIANCA_ADOLESCENTE CA ON P.ID = CA.PESSOA_ID
        LEFT JOIN MULHER_APOLONIA MA ON P.ID = MA.PESSOA_ID
        WHERE A.STATUS_CHECKIN IS NOT NULL
          AND A.STATUS_CHECKIN NOT IN ('NAO_ENVIADO', 'AGUARDANDO_RESPOSTA')
    """
    try:
        cur = conn.cursor()
        cur.execute(query)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        df = pd.DataFrame(rows, columns=cols)

        if len(df) >= 20:
            print(f"  Extraídos {len(df)} registros reais com checkin finalizado.")
            conn.close()
            return df, True
        else:
            print(f"  Banco tem apenas {len(df)} registros com checkin finalizado (mínimo 20).")
            conn.close()
            return df, False
    except Exception as e:
        print(f"  Erro na query: {e}")
        try:
            conn.close()
        except Exception:
            pass
        return pd.DataFrame(), False


def preprocessar(df):
    # Normalizar o nome do canal para minúsculas sem espaço
    df = df.copy()
    df["CANAL"] = df["CANAL"].map(lambda c: MAPA_CANAL.get(c, str(c).lower().replace(" ", "_")))
    df["TIPO_PESSOA"] = df["TIPO_PESSOA"].fillna("OUTRO")
    df["STATUS_ATENDIMENTO"] = df["STATUS_ATENDIMENTO"].fillna("ABERTO")
    df["GRAVIDADE"] = df["GRAVIDADE"].fillna(0).astype(int)
    df["RISCO"] = df["RISCO"].fillna(0).astype(int)
    df["PRIORIDADE"] = df["PRIORIDADE"].fillna(3).astype(int)
    return df


def treinar():
    print("=" * 50)
    print("  RETREINAMENTO CHECK-IN - TDB Responde IA")
    print("=" * 50)

    conn = conectar_oracle()
    df_real = pd.DataFrame()
    tem_real = False

    if conn:
        df_real, tem_real = buscar_dados_reais(conn)

    df_ficticio = gerar_dados_ficticios(600)

    if tem_real and not df_real.empty:
        print(f"  Combinando {len(df_real)} registros reais + {len(df_ficticio)} fictícios.")
        df = pd.concat([df_real, df_ficticio], ignore_index=True)
    else:
        print("  Usando apenas dados fictícios para o treinamento.")
        df = df_ficticio

    df = preprocessar(df)
    df = df[df["STATUS_CHECKIN"].isin(STATUS_CHECKIN_TARGET)]

    print(f"\n  Distribuição do target:")
    print(df["STATUS_CHECKIN"].value_counts().to_string())

    feature_cols = ["TIPO_PESSOA", "CANAL", "STATUS_ATENDIMENTO", "GRAVIDADE", "RISCO", "PRIORIDADE"]
    X = df[feature_cols]
    y = df["STATUS_CHECKIN"]

    cat_feats = ["TIPO_PESSOA", "CANAL", "STATUS_ATENDIMENTO"]
    num_feats = ["GRAVIDADE", "RISCO", "PRIORIDADE"]

    preprocessor = ColumnTransformer(transformers=[
        ('num', StandardScaler(), num_feats),
        ('cat', OneHotEncoder(handle_unknown='ignore'), cat_feats)
    ])

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced'))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"\n  Treinando Random Forest com {len(X_train)} exemplos...")
    pipeline.fit(X_train, y_train)

    score = pipeline.score(X_test, y_test)
    print(f"  Acuracia no conjunto de testes: {score * 100:.2f}%")

    pacote = {
        "pipeline": pipeline,
        "modelo_nome": "Random Forest Check-in v2",
        "classes": list(pipeline.classes_),
        "features": feature_cols,
        "fonte_dados": "Oracle + Fictício" if tem_real else "Fictício (fallback)",
        "registros_reais": len(df_real),
    }

    joblib.dump(pacote, "modelo_checkin.joblib")
    print(f"\n  Modelo salvo em 'modelo_checkin.joblib'!")
    print(f"  Fonte dos dados: {pacote['fonte_dados']}")
    print("=" * 50)


if __name__ == "__main__":
    treinar()
