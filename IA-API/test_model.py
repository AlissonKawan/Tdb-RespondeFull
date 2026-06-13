import joblib
import pandas as pd

pacote = joblib.load("modelo_tdb.joblib")
pipeline = pacote["pipeline"]
label_encoder = pacote.get("label_encoder")

def testar(texto):
    entrada = pd.DataFrame([{
        "conteudo": texto,
        "enviado_por": "BENEFICIARIO",
        "canal": "email",
        "prioridade_atendimento": 1,
        "status_atendimento": "SOLICITADO",
        "tipo_pessoa": "OUTRO",
        "gravidade": 1
    }])
    
    pred = pipeline.predict(entrada)[0]
    if label_encoder is not None:
        cat = label_encoder.inverse_transform([pred])[0]
    else:
        cat = pred
        
    prob = pipeline.predict_proba(entrada)[0]
    print(f"Texto: '{texto}' -> {cat}")
    print(f"Probabilidades: {dict(zip(pipeline.classes_, prob))}\n")

testar("Gostei do atendimento do Alisson ótimo profissional")
testar("Voces sao horriveis e o atendimento demorou muito")
testar("Preciso de ajuda urgente, dor intensa no dente")
testar("Eu confirmo presenca amanhã na consulta")
testar("Acho que o site de vocês poderia ser mais rápido")
