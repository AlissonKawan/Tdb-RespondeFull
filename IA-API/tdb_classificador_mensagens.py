# =============================================================================
# TDB Responde — Notebook Sprint 4
# Classificação Automática de Mensagens
# Execute célula por célula no Jupyter Notebook ou VS Code
# =============================================================================

# =============================================================================
# CÉLULA 1 — Instalação das dependências
# Execute esta célula apenas uma vez
# =============================================================================
# O comando abaixo instala todas as bibliotecas necessárias para rodar o projeto.
# O "!" no início serve para rodar comandos do terminal dentro do notebook.
# Está comentado com "#" porque você já instalou via terminal — descomente se precisar rodar aqui.
# !pip install scikit-learn pandas joblib xgboost matplotlib seaborn flask flask-cors


# =============================================================================
# CÉLULA 2 — Imports
# =============================================================================

# pandas: biblioteca para manipular tabelas de dados (DataFrames)
import pandas as pd

# numpy: biblioteca para operações matemáticas e geração de números aleatórios
import numpy as np

# matplotlib: biblioteca para criar gráficos e visualizações
import matplotlib.pyplot as plt

# seaborn: biblioteca de gráficos mais bonitos, usada para a matriz de confusão
import seaborn as sns

# joblib: usado para salvar e carregar o modelo treinado em disco
import joblib

# warnings: módulo para controlar mensagens de aviso do Python
import warnings

# Oculta todos os avisos desnecessários durante a execução
warnings.filterwarnings("ignore")

# Pipeline: permite encadear várias etapas de processamento em sequência (ex: preprocessar → treinar)
from sklearn.pipeline import Pipeline

# ColumnTransformer: aplica transformações diferentes para cada tipo de coluna ao mesmo tempo
from sklearn.compose import ColumnTransformer

# StandardScaler: normaliza números para que fiquem na mesma escala (evita que valores grandes dominem)
# OneHotEncoder: transforma categorias em colunas binárias (ex: "whatsapp" vira 0 ou 1)
# LabelEncoder: transforma nomes de classes em números (necessário para o XGBoost)
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder

# TfidfVectorizer: transforma textos em números usando a técnica TF-IDF
# (mede quão importante uma palavra é em relação ao restante dos textos)
from sklearn.feature_extraction.text import TfidfVectorizer

# LogisticRegression: modelo de classificação linear, simples e rápido
from sklearn.linear_model import LogisticRegression

# RandomForestClassifier: modelo baseado em múltiplas árvores de decisão, muito robusto
from sklearn.ensemble import RandomForestClassifier

# SVC: Support Vector Machine, modelo que encontra a melhor fronteira entre as classes
from sklearn.svm import SVC

# train_test_split: divide os dados em treino e teste
# cross_val_score: avalia o modelo com validação cruzada
# StratifiedKFold: define como dividir os dados na validação cruzada, mantendo proporção das classes
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold

# classification_report: gera relatório com precisão, recall e F1 por classe
# confusion_matrix: gera a matriz de confusão (quantos acertos e erros por categoria)
# f1_score: métrica que equilibra precisão e recall — usada para comparar os modelos
# accuracy_score: percentual de predições corretas
from sklearn.metrics import classification_report, confusion_matrix, f1_score, accuracy_score

# XGBClassifier: modelo de boosting de gradiente, um dos mais poderosos para classificação
from xgboost import XGBClassifier

# Confirmação de que todos os imports carregaram sem erro
print("Imports carregados com sucesso!")


# =============================================================================
# CÉLULA 3 — Geração do Dataset Sintético
# Baseado nos campos reais do sistema Java TDB Responde:
#   Mensagem.conteudo, Mensagem.enviadoPor, Mensagem.canal.nome,
#   Atendimento.prioridade (1-4), Atendimento.status,
#   PessoaAtendida.tipo, gravidadeBucal / nivelRisco
# =============================================================================

# Dicionário com 50 textos reais por categoria.
# Cada chave é o nome da categoria (o que o modelo vai aprender a prever).
# Os textos são variados de propósito para o modelo aprender padrões, não decorar frases.
textos = {
    "reclamacao": [
        "Esperamos mais de duas horas e ninguém nos atendeu",
        "Meu filho foi maltratado pelo atendente, péssimo serviço",
        "Fui embora sem ser atendida, uma vergonha isso",
        "Já é a terceira vez que venho aqui e não consigo atendimento",
        "O dentista não apareceu na consulta marcada, absurdo",
        "Fui atendida depois de 3 horas de espera, completamente desorganizado",
        "Minha filha ficou chorando de dor esperando e ninguém fez nada",
        "Reclamei do atendimento e ninguém me deu retorno nenhum",
        "O sistema não funciona, tentei agendar e deu erro várias vezes",
        "Trataram meu filho com descaso, vou reclamar formalmente",
        "Não fui informada sobre o cancelamento da consulta",
        "Chegamos cedo e fomos atendidos por último, sem explicação",
        "O voluntário foi grosseiro e não deixou eu falar",
        "Ninguém me respondeu no whatsapp há dois dias",
        "Marquei consulta por email e não recebi confirmação nenhuma",
        "Fui encaminhada pro lugar errado e tive que voltar outra hora",
        "Minha situação piorou enquanto esperava o atendimento",
        "Não consigo agendar pelo site, está fora do ar desde ontem",
        "Fui ignorada quando pedi informação na recepção",
        "Prometeram me ligar e nunca ligaram",
        "O atendimento foi cancelado sem aviso prévio",
        "Não tem cadeira pra sentar enquanto espera, péssimo",
        "Meu caso foi passado para outro voluntário sem me avisar",
        "Perdi dia de trabalho pra vir aqui e não fui atendida",
        "O dentista atrasou duas horas e não pediu desculpas",
        "Meu filho tem medo e o atendente foi impaciente com ele",
        "Ninguém explicou o procedimento antes de fazer",
        "Saí sem entender nada do que foi feito no atendimento",
        "Me pediram documentos que eu já tinha entregado antes",
        "O telefone não atende, tentei ligar quinze vezes",
        "Meu caso ficou parado por semanas sem nenhuma atualização",
        "Fui ao endereço indicado e o local estava fechado",
        "Perdi o ônibus esperando e não fui atendida mesmo assim",
        "Recebi informações diferentes de dois atendentes diferentes",
        "Me disseram que meu caso não era urgente e eu discordo",
        "O tratamento foi interrompido sem explicação",
        "Ninguém me avisou que precisaria de exame antes da consulta",
        "Minha solicitação foi ignorada por mais de uma semana",
        "O sistema marcou minha consulta no dia errado",
        "Fui mal atendida por telefone, a pessoa foi grossa comigo",
        "Chegamos no horário marcado e a consulta havia sido cancelada",
        "Meu filho ficou com dor depois do procedimento e ninguém orientou",
        "Não consegui falar com nenhum responsável sobre meu caso",
        "O atendimento foi muito demorado para um caso simples",
        "Me mandaram de um lado pro outro sem resolver nada",
        "Fui atendida por alguém sem preparo, me senti insegura",
        "O voluntário não sabia responder minhas perguntas básicas",
        "Enviou mensagem pelo whatsapp e ficou sem resposta por dias",
        "Minha consulta foi remarcada três vezes seguidas",
        "Não fui informada sobre os direitos que tenho nesse atendimento",
    ],
    "elogio": [
        "O dentista foi muito cuidadoso com minha filha, adoramos",
        "Quero agradecer imensamente pelo atendimento que recebi",
        "Excelente serviço, meu filho saiu sorrindo da consulta",
        "A voluntária foi super atenciosa e paciente, parabéns",
        "Graças a vocês meu filho está sem dor de dente pela primeira vez",
        "Nunca fui tão bem atendida, estão de parabéns",
        "A equipe foi incrível, me senti acolhida em todos os momentos",
        "O atendimento foi muito rápido e eficiente, impressionante",
        "Obrigada de coração pelo cuidado com meu filho",
        "Vocês fazem um trabalho lindo e muito importante",
        "A recepcionista foi muito simpática e me deixou à vontade",
        "Meu filho tinha medo de dentista, mas saiu feliz dessa vez",
        "Melhor atendimento que já recebi, gratidão enorme",
        "O voluntário explicou tudo com muita calma e atenção",
        "Serviço impecável do início ao fim, muito obrigada",
        "A consulta foi rápida e a doutora foi muito gentil",
        "Vocês mudaram a vida do meu filho com esse atendimento",
        "Fiquei impressionada com a qualidade do serviço de vocês",
        "O atendimento presencial foi perfeito, me senti cuidada",
        "Equipe muito profissional e humana, é difícil encontrar isso",
        "Parabéns a todos que fazem esse projeto acontecer",
        "Me trataram com muito respeito e dignidade",
        "O dentista foi incrível com minha menina de 5 anos",
        "Meu filho não queria ir mas agora quer voltar, que conquista",
        "Agradeço cada detalhe do atendimento que recebi hoje",
        "A voluntária me ligou para confirmar e fui muito bem recebida",
        "Serviço de altíssima qualidade para quem mais precisa",
        "O tratamento foi completo e o acompanhamento foi excelente",
        "Fui bem orientada em todos os passos, obrigada pela paciência",
        "O ambiente é acolhedor e a equipe é muito dedicada",
        "Recomendo esse serviço para todas as mães que conheço",
        "Me senti respeitada e bem cuidada durante todo o processo",
        "O atendimento superou todas as minhas expectativas",
        "Cada pessoa que me atendeu foi extraordinária",
        "Meu filho está muito feliz com o resultado do tratamento",
        "Foram pontuais, atenciosos e muito competentes",
        "Nunca imaginei receber um atendimento tão humanizado",
        "A equipe é nota dez, não tenho nada a reclamar",
        "Obrigada por existirem e fazerem a diferença na minha vida",
        "Foram muito pacientes com minha filha que tem autismo",
        "O tratamento foi longo mas o acompanhamento foi perfeito",
        "Voltarei sempre que precisar, confiança total no serviço",
        "Saí da consulta com o coração cheio de gratidão",
        "Excelente iniciativa e execução, parabéns pela organização",
        "O voluntário foi além do que eu esperava, muito dedicado",
        "Me surpreenderam positivamente em cada etapa",
        "Atendimento com muita empatia e cuidado genuíno",
        "Tudo correu perfeitamente, estou muito satisfeita",
        "Que trabalho bonito e necessário, meu muito obrigada",
        "A equipe se importou de verdade com o meu caso",
    ],
    "sugestao": [
        "Seria ótimo ter atendimento aos sábados para quem trabalha",
        "Sugiro criar um aplicativo para facilitar o agendamento",
        "Seria bom ter uma sala de espera maior e mais confortável",
        "Poderiam enviar lembrete por whatsapp um dia antes da consulta",
        "Seria útil ter uma lista de documentos necessários no site",
        "Sugiro atendimento por videochamada para casos de urgência",
        "Seria bom ter brinquedos na sala de espera para as crianças",
        "Poderiam disponibilizar um canal de atendimento no telegram",
        "Sugiro criar um formulário online mais simples de preencher",
        "Seria interessante ter retorno automático após o envio",
        "Poderiam melhorar a comunicação sobre os horários disponíveis",
        "Sugiro adicionar um chat ao vivo no site de vocês",
        "Seria bom ter atendimento em mais bairros da cidade",
        "Poderiam criar uma área do usuário para acompanhar o caso",
        "Sugiro enviar um resumo do atendimento por email ao final",
        "Seria útil ter uma linha direta para casos urgentes",
        "Poderiam ampliar o horário de atendimento para noite",
        "Sugiro ter um voluntário especializado em atender crianças pequenas",
        "Seria ótimo ter parceria com escolas para facilitar o acesso",
        "Poderiam disponibilizar transporte para quem mora longe",
        "Sugiro criar um grupo no whatsapp com dicas de saúde bucal",
        "Seria bom ter acompanhamento pós-consulta por pelo menos um mês",
        "Poderiam treinar os voluntários para atender casos de ansiedade",
        "Sugiro criar um programa de visitas às escolas da região",
        "Seria útil ter um número de emergência fora do horário comercial",
        "Poderiam oferecer material educativo sobre prevenção bucal",
        "Sugiro aumentar a frequência dos atendimentos nos bairros mais distantes",
        "Seria bom ter intérprete de libras disponível no atendimento",
        "Poderiam criar um sistema de fila online para evitar espera",
        "Sugiro disponibilizar os formulários também em papel para quem não tem internet",
        "Seria interessante ter parcerias com creches e berçários",
        "Poderiam criar um programa de fidelização para casos de longo prazo",
        "Sugiro criar uma newsletter mensal com novidades do projeto",
        "Seria bom ter mais opções de canal para enviar documentos",
        "Poderiam criar um guia de primeiros socorros bucais para distribuir",
        "Sugiro fazer um evento aberto na comunidade para divulgar o projeto",
        "Seria útil ter um painel online com horários disponíveis em tempo real",
        "Poderiam criar um programa de mentoria para os voluntários novos",
        "Sugiro criar um canal específico no youtube com orientações bucais",
        "Seria bom ter um espaço no site para depoimentos de quem foi atendido",
        "Poderiam enviar pesquisa de satisfação após cada atendimento",
        "Sugiro criar um mapa interativo com os pontos de atendimento",
        "Seria interessante ter parceria com farmácias locais para medicamentos",
        "Poderiam criar um grupo de apoio entre as famílias atendidas",
        "Sugiro que o site tenha versão simplificada para celular mais antigo",
        "Seria bom ter um voluntário disponível apenas para dúvidas rápidas",
        "Poderiam criar um fluxo mais claro de como funciona o atendimento",
        "Sugiro criar um canal de atendimento exclusivo para adolescentes",
        "Seria útil ter um histórico de atendimentos acessível pelo beneficiário",
        "Poderiam criar um programa de reconhecimento para os voluntários mais ativos",
    ],
    "urgencia": [
        "Minha filha está com muita dor de dente, precisa de ajuda hoje",
        "Preciso de atendimento urgente, meu filho não para de chorar de dor",
        "Situação crítica, minha menina não consegue comer de tanta dor",
        "Urgente, meu filho está com o rosto inchado e com febre",
        "Preciso de socorro agora, minha filha está sofrendo muito",
        "Não aguenta mais de dor, precisamos de ajuda com urgência",
        "Dor insuportável, meu filho não dormiu a noite toda",
        "Caso urgente, criança com infecção na boca e febre alta",
        "Preciso de atendimento hoje, está em situação crítica de dor",
        "Minha menina está em pânico de dor, por favor me ajudem",
        "Urgentíssimo, o dente do meu filho quebrou e está sangrando",
        "Meu filho caiu e bateu os dentes, está com sangramento",
        "Preciso de ajuda hoje mesmo, é grave",
        "Situação de emergência bucal, dente infeccionado com pus",
        "Criança com dor insuportável há mais de 24 horas",
        "Meu filho não consegue falar direito de tanta dor",
        "Urgente, possível fratura no dente após acidente",
        "Febre alta e inchaço no rosto, pode ser infecção grave",
        "Meu filho está com a bochecha inchada desde ontem, é urgente",
        "Dor de dente com febre há dois dias, preciso de ajuda rápido",
        "Criança não consegue dormir de dor, preciso de atendimento agora",
        "Urgente, meu filho engoliu parte de um dente quebrado",
        "Preciso de ajuda imediata, criança com sangramento na boca",
        "Situação grave, criança com abscesso dentário e muita dor",
        "Meu filho está com inchaço no pescoço, preciso de socorro",
        "Urgente, dente de leite caiu antes do tempo e está sangrando",
        "Criança com dor insuportável no dente do siso que está nascendo",
        "Preciso de alguém hoje, minha filha não consegue comer nada",
        "Emergência, fratura no maxilar após queda",
        "Meu filho tem 4 anos e está em desespero de dor",
        "Urgente, criança com dor e calafrios, pode ser infecção grave",
        "Preciso de consulta emergencial hoje, caso muito sério",
        "Minha filha tem febre há 3 dias junto com dor de dente",
        "Dente trincado após acidente, está com dor intensa",
        "Urgente por favor, a situação piorou muito esta noite",
        "Sangramento que não para há mais de uma hora",
        "Meu filho está se recusando a comer de tanta dor",
        "Criança com inchaço visível na bochecha desde esta manhã",
        "Preciso de ajuda agora, não pode esperar",
        "Caso grave, criança com dor e febre há mais de dois dias",
        "Urgentíssimo, minha filha está chorando sem parar",
        "Infecção na gengiva com pus, preciso de atendimento hoje",
        "Meu filho bateu o dente e ele ficou torto, emergência",
        "Preciso de resposta urgente, situação piorou de ontem pra hoje",
        "Criança com dor muito forte no rosto e no ouvido",
        "Urgente, meu filho não consegue abrir a boca direito",
        "Preciso de socorro, minha filha está chorando de dor há horas",
        "Dor de dente com inchaço, febre e cheiro ruim na boca",
        "Meu filho está com o rosto deformado de inchaço, socorro",
        "Caso gravíssimo, preciso de atendimento urgente agora",
    ],
    "informativo": [
        "Confirmo minha consulta para amanhã às 14h",
        "Preciso remarcar minha consulta do dia 15, por favor",
        "Gostaria de saber o horário de funcionamento de vocês",
        "Quais documentos preciso levar para o primeiro atendimento",
        "Minha filha já foi atendida, obrigada, estamos bem",
        "Confirmo presença no atendimento de quarta-feira",
        "Quero cancelar o agendamento da próxima semana",
        "Gostaria de saber se vocês atendem crianças menores de 2 anos",
        "Recebi o contato de vocês por indicação de uma amiga",
        "Estou enviando os documentos solicitados na última consulta",
        "Apenas informando que chegamos ao endereço indicado",
        "Quero confirmar o endereço do atendimento presencial",
        "Vou precisar remarcar para a semana que vem",
        "Pode confirmar se meu caso foi recebido pelo sistema",
        "Enviando retorno sobre o tratamento iniciado na semana passada",
        "Gostaria de atualizar meu número de telefone no cadastro",
        "Preciso saber se posso levar o irmão mais novo também",
        "Informando que a consulta de hoje foi realizada com sucesso",
        "Quero saber se já tem vaga disponível para este mês",
        "Estou enviando foto do dente conforme solicitado pelo dentista",
        "Meu filho já tomou o remédio indicado, está melhorando",
        "Apenas avisando que vamos chegar 20 minutos atrasados",
        "Pode me passar o nome do dentista que vai me atender",
        "Confirmo que recebi o email com as instruções",
        "Gostaria de saber sobre o acompanhamento após o tratamento",
        "Preciso de um declaração de atendimento para a escola",
        "Informando que meu telefone mudou, o novo é outro número",
        "Pode me informar quanto tempo dura a consulta inicial",
        "Quero saber se vocês atendem no período da tarde",
        "Estou confirmando os dados do cadastro que vocês me pediram",
        "Recebi a confirmação da consulta, estarei presente",
        "Preciso de informação sobre como funciona o tratamento completo",
        "Vou levar a carteirinha de saúde conforme solicitado",
        "Gostaria de saber se o atendimento é gratuito mesmo",
        "Tenho dúvida sobre quantas consultas são necessárias",
        "Pode me indicar o ponto de ônibus mais próximo do local",
        "Quero atualizar o email de contato no meu cadastro",
        "Recebi a ligação de vocês e estou retornando o contato",
        "Enviando os exames pedidos pelo dentista na última visita",
        "Preciso saber se é necessário estar em jejum para a consulta",
        "Informando que o tratamento foi concluído com sucesso",
        "Vou precisar de uma segunda via da declaração de atendimento",
        "Pode confirmar se o whatsapp é o canal correto para enviar documentos",
        "Estou aguardando o retorno sobre meu agendamento",
        "Preciso de informação sobre o protocolo de atendimento de vocês",
        "Apenas atualizando que minha filha está se recuperando bem",
        "Gostaria de saber se aceita plano de saúde ou apenas SUS",
        "Confirmo que estarei no endereço correto na hora marcada",
        "Preciso de orientações sobre cuidados pós-consulta",
        "Estou retornando o contato conforme combinado anteriormente",
    ]
}

# Dicionário que define os metadados coerentes para cada categoria.
# Por exemplo: urgência sempre tem prioridade 1 ou 2 e gravidade alta (4 ou 5).
# Isso evita dados contraditórios (ex: urgência com prioridade baixa e gravidade 1).
config = {
    "reclamacao":  {"prioridade": [2, 3, 4], "status": ["ABERTO", "SOLICITADO"],                    "enviado_por": ["BENEFICIARIO"],               "gravidade": [1, 2, 3]},
    "elogio":      {"prioridade": [3, 4],    "status": ["ENCERRADO"],                                "enviado_por": ["BENEFICIARIO"],               "gravidade": [1, 2]},
    "sugestao":    {"prioridade": [3, 4],    "status": ["ABERTO", "ENCERRADO"],                      "enviado_por": ["BENEFICIARIO"],               "gravidade": [1, 2, 3]},
    "urgencia":    {"prioridade": [1, 2],    "status": ["ABERTO", "SOLICITADO"],                     "enviado_por": ["BENEFICIARIO"],               "gravidade": [4, 5]},
    "informativo": {"prioridade": [3, 4],    "status": ["ABERTO", "EM_ATENDIMENTO", "ENCERRADO"],    "enviado_por": ["BENEFICIARIO", "VOLUNTARIO"], "gravidade": [1, 2, 3]},
}

# Lista de canais e tipos de pessoa disponíveis no sistema Java
canais      = ["whatsapp", "email", "telefone", "presencial"]
tipo_pessoa = ["CRIANCA_ADOLESCENTE", "MULHER_APOLONIA", "OUTRO"]

# Fixa a semente aleatória para que o dataset gerado seja sempre igual (reprodutível)
np.random.seed(42)

# Lista vazia que vai acumular todos os registros do dataset
registros = []

# Loop principal: para cada categoria e sua lista de textos...
for categoria, lista_textos in textos.items():
    # Pega a configuração de metadados daquela categoria
    cfg = config[categoria]
    # Para cada texto daquela categoria...
    for texto in lista_textos:
        # Cria um registro com o texto e metadados escolhidos aleatoriamente
        # dentro dos valores válidos para aquela categoria
        registros.append({
            "conteudo":               texto,
            # Escolhe aleatoriamente quem enviou (entre os valores válidos da categoria)
            "enviado_por":            np.random.choice(cfg["enviado_por"]),
            # Escolhe aleatoriamente o canal de comunicação
            "canal":                  np.random.choice(canais),
            # Escolhe aleatoriamente a prioridade do atendimento (coerente com a categoria)
            "prioridade_atendimento": np.random.choice(cfg["prioridade"]),
            # Escolhe aleatoriamente o status do atendimento
            "status_atendimento":     np.random.choice(cfg["status"]),
            # Escolhe aleatoriamente o tipo de pessoa atendida
            "tipo_pessoa":            np.random.choice(tipo_pessoa),
            # Escolhe aleatoriamente a gravidade (coerente com a categoria)
            "gravidade":              np.random.choice(cfg["gravidade"]),
            # A categoria é o label — o que o modelo vai aprender a prever
            "categoria":              categoria
        })

# Transforma a lista de dicionários em um DataFrame do pandas (tabela)
df = pd.DataFrame(registros)

# Salva o dataset em um arquivo CSV para consulta posterior
df.to_csv("dataset_tdb.csv", index=False)

# Exibe o total de registros gerados e quantos há por categoria
print(f"Dataset gerado: {len(df)} registros")
print(df["categoria"].value_counts())


# =============================================================================
# CÉLULA 4 — Pré-processamento e Pipeline
# =============================================================================

# Separa as features (entradas) do label (saída que queremos prever)
X = df.drop(columns=["categoria"])  # X = todas as colunas exceto "categoria"
y = df["categoria"]                 # y = apenas a coluna "categoria" (o que queremos prever)

# Define o nome da coluna de texto
feat_texto = "conteudo"

# Define as colunas categóricas (valores de texto que representam categorias)
feat_cat = ["enviado_por", "canal", "status_atendimento", "tipo_pessoa"]

# Define as colunas numéricas
feat_num = ["prioridade_atendimento", "gravidade"]

# Lista de palavras comuns em português que não ajudam na classificação.
# Removê-las melhora a qualidade das features extraídas do texto.
stopwords_pt = [
    "de", "da", "do", "em", "para", "com", "por", "um", "uma", "que",
    "não", "se", "na", "no", "as", "os", "o", "a", "e", "é", "foi",
    "me", "meu", "minha", "meus", "minhas", "seu", "sua", "mais",
    "muito", "também", "já", "mas", "como", "ao", "aos", "das", "dos",
    "ela", "ele", "eles", "elas", "eu", "você", "nós", "isso", "este"
]

# Cria o pré-processador que trata cada tipo de coluna de forma diferente:
preprocessor = ColumnTransformer(transformers=[

    # Para a coluna de texto: aplica TF-IDF
    # max_features=800: usa as 800 palavras/bigramas mais relevantes
    # ngram_range=(1,2): considera palavras sozinhas E pares de palavras (ex: "muita dor")
    # strip_accents="unicode": remove acentos para normalizar o texto
    # lowercase=True: converte tudo para minúsculas
    # stop_words: ignora as palavras comuns definidas acima
    ("texto",      TfidfVectorizer(max_features=800, ngram_range=(1, 2),
                                   strip_accents="unicode", lowercase=True,
                                   stop_words=stopwords_pt), feat_texto),

    # Para colunas categóricas: aplica OneHotEncoder
    # handle_unknown="ignore": se aparecer um valor novo na predição, ignora sem dar erro
    ("categorico", OneHotEncoder(handle_unknown="ignore"), feat_cat),

    # Para colunas numéricas: aplica StandardScaler
    # Normaliza os números para média 0 e desvio padrão 1
    # Isso evita que "gravidade 5" pese mais que "prioridade 4" só pelo valor
    ("numerico",   StandardScaler(), feat_num),
])

print("Pipeline de pré-processamento configurada!")


# =============================================================================
# CÉLULA 5 — Divisão treino/teste e treino dos modelos
# =============================================================================

# Divide os dados: 80% para treinar os modelos, 20% para testar
# random_state=42: garante que a divisão seja sempre a mesma (reprodutível)
# stratify=y: mantém a proporção das categorias tanto no treino quanto no teste
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Treino: {len(X_train)} registros | Teste: {len(X_test)} registros")

# O XGBoost exige que os labels (y) sejam números, não texto.
# LabelEncoder converte as categorias em números: elogio=0, informativo=1, etc.
le = LabelEncoder()
y_train_enc = le.fit_transform(y_train)  # Aprende o mapeamento e transforma o treino
y_test_enc  = le.transform(y_test)       # Só transforma o teste (sem reaprender)

# Dicionário com os 4 modelos que serão treinados e comparados
modelos_config = {
    # Regressão Logística: modelo linear, simples e interpretável
    "Regressao Logistica": LogisticRegression(max_iter=1000, random_state=42),

    # Random Forest: conjunto de 200 árvores de decisão — robusto e preciso
    "Random Forest":       RandomForestClassifier(n_estimators=200, random_state=42),

    # SVM: encontra a margem máxima entre as classes — bom para texto
    "SVM":                 SVC(kernel="linear", probability=True, random_state=42),

    # XGBoost: boosting de gradiente com 200 estimadores — geralmente o mais preciso
    "XGBoost":             XGBClassifier(n_estimators=200, random_state=42,
                                         eval_metric="mlogloss", verbosity=0),
}

# Dicionário vazio para guardar os resultados de cada modelo após o treino
resultados = {}

# Loop que treina e avalia cada modelo
for nome, clf in modelos_config.items():
    print(f"\nTreinando {nome}...")

    # O XGBoost precisa de labels numéricos, então usa y_train_enc
    if nome == "XGBoost":
        # Cria uma pipeline: primeiro pré-processa os dados, depois treina o classificador
        pipe = Pipeline([("preprocessor", preprocessor), ("classifier", clf)])
        pipe.fit(X_train, y_train_enc)           # Treina com labels codificados
        y_pred_enc = pipe.predict(X_test)         # Prediz no conjunto de teste (retorna números)
        y_pred     = le.inverse_transform(y_pred_enc)  # Converte os números de volta para nomes
    else:
        # Para os outros modelos, usa os labels textuais diretamente
        pipe   = Pipeline([("preprocessor", preprocessor), ("classifier", clf)])
        pipe.fit(X_train, y_train)    # Treina o modelo
        y_pred = pipe.predict(X_test) # Prediz no conjunto de teste

    # Calcula as métricas de avaliação
    acc = accuracy_score(y_test, y_pred)            # Percentual de acertos
    f1  = f1_score(y_test, y_pred, average="macro") # F1 médio entre todas as categorias

    # Salva o modelo e suas métricas no dicionário de resultados
    resultados[nome] = {"pipeline": pipe, "accuracy": acc, "f1_macro": f1, "y_pred": y_pred}

    # Exibe as métricas no terminal
    print(f"  Acurácia : {acc:.4f}")
    print(f"  F1-macro : {f1:.4f}")

    # Exibe o relatório completo com precisão, recall e F1 por categoria
    print(classification_report(y_test, y_pred))


# =============================================================================
# CÉLULA 6 — Comparação visual dos modelos
# =============================================================================

# Extrai os nomes, acurácias e F1-scores de cada modelo para plotar
nomes     = list(resultados.keys())
acuracias = [resultados[n]["accuracy"] for n in nomes]
f1_scores = [resultados[n]["f1_macro"] for n in nomes]

# Cria posições no eixo X para as barras
x = np.arange(len(nomes))

# Define a largura de cada barra
largura = 0.35

# Cria a figura e o eixo do gráfico
fig, ax = plt.subplots(figsize=(10, 5))

# Plota as barras de acurácia (azul) levemente à esquerda do centro
bars1 = ax.bar(x - largura/2, acuracias, largura, label="Acurácia",  color="#2563EB")

# Plota as barras de F1-Macro (verde) levemente à direita do centro
bars2 = ax.bar(x + largura/2, f1_scores,  largura, label="F1-Macro", color="#16A34A")

# Define o título e configurações visuais do gráfico
ax.set_title("Comparação de Desempenho dos Modelos", fontsize=14, fontweight="bold")
ax.set_xticks(x)                               # Posiciona os rótulos no eixo X
ax.set_xticklabels(nomes, rotation=10)         # Nome de cada modelo rotacionado 10 graus
ax.set_ylim(0, 1.1)                            # Escala do eixo Y de 0 a 1.1
ax.legend()                                    # Exibe a legenda (Acurácia / F1-Macro)
ax.bar_label(bars1, fmt="%.3f", padding=3)     # Mostra o valor em cima de cada barra azul
ax.bar_label(bars2, fmt="%.3f", padding=3)     # Mostra o valor em cima de cada barra verde

plt.tight_layout()                             # Ajusta o layout para não cortar nada
plt.savefig("comparacao_modelos.png", dpi=150) # Salva o gráfico em arquivo PNG
plt.show()                                     # Exibe o gráfico na tela
print("Gráfico salvo: comparacao_modelos.png")


# =============================================================================
# CÉLULA 7 — Seleção do melhor modelo e validação cruzada
# =============================================================================

# Encontra o modelo com maior F1-macro dentre os treinados
# max() com key=lambda percorre o dicionário e compara pelo campo "f1_macro"
melhor_nome = max(resultados, key=lambda n: resultados[n]["f1_macro"])
melhor      = resultados[melhor_nome]

print(f"Melhor modelo: {melhor_nome}")
print(f"  Acurácia : {melhor['accuracy']:.4f}")
print(f"  F1-macro : {melhor['f1_macro']:.4f}")

# O XGBoost precisa de y codificado também na validação cruzada
if melhor_nome == "XGBoost":
    y_cv = le.transform(y)  # Converte todos os labels para números
else:
    y_cv = y                # Para os demais modelos, usa os labels textuais

# Configura a validação cruzada com 5 folds estratificados
# shuffle=True: embaralha os dados antes de dividir
# random_state=42: garante reprodutibilidade
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Avalia o melhor modelo em 5 divisões diferentes dos dados
# scoring="f1_macro": métrica usada em cada fold
scores = cross_val_score(melhor["pipeline"], X, y_cv, cv=cv, scoring="f1_macro")

# Exibe a média e o desvio padrão do F1-macro nos 5 folds
# Um desvio padrão baixo indica que o modelo é estável
print(f"\nValidação cruzada (5-fold) — F1-macro: {scores.mean():.4f} ± {scores.std():.4f}")


# =============================================================================
# CÉLULA 8 — Matriz de confusão do modelo vencedor
# =============================================================================

# Lista as categorias em ordem alfabética para o eixo da matriz
classes_ordem = sorted(y.unique())

# Gera a matriz de confusão comparando os valores reais (y_test) com as predições
cm = confusion_matrix(y_test, melhor["y_pred"], labels=classes_ordem)

# Cria a figura para o heatmap
fig, ax = plt.subplots(figsize=(8, 6))

# Plota o heatmap da matriz de confusão
# annot=True: mostra os números dentro de cada célula
# fmt="d": formato inteiro (sem casas decimais)
# cmap="Blues": escala de cores azul (mais escuro = mais ocorrências)
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=classes_ordem,  # Rótulos do eixo X (predito)
            yticklabels=classes_ordem,  # Rótulos do eixo Y (real)
            ax=ax)

ax.set_title(f"Matriz de Confusão — {melhor_nome}", fontsize=13, fontweight="bold")
ax.set_xlabel("Predito")  # Rótulo do eixo X
ax.set_ylabel("Real")     # Rótulo do eixo Y

plt.tight_layout()
plt.savefig("matriz_confusao.png", dpi=150)  # Salva o gráfico
plt.show()
print("Gráfico salvo: matriz_confusao.png")


# =============================================================================
# CÉLULA 9 — Importância das features (Random Forest / XGBoost)
# =============================================================================

# Esse gráfico só é gerado para modelos baseados em árvores,
# pois eles expõem o atributo feature_importances_
if melhor_nome in ["Random Forest", "XGBoost"]:

    # Extrai o classificador e o pré-processador da pipeline
    clf_final  = melhor["pipeline"].named_steps["classifier"]
    prep_final = melhor["pipeline"].named_steps["preprocessor"]

    # Recupera os nomes das features geradas pelo TF-IDF (palavras e bigramas)
    tfidf_nomes = prep_final.named_transformers_["texto"].get_feature_names_out()

    # Recupera os nomes das features geradas pelo OneHotEncoder (ex: canal_whatsapp)
    ohe_nomes = prep_final.named_transformers_["categorico"].get_feature_names_out()

    # Converte a lista de features numéricas para array numpy
    num_nomes = np.array(feat_num)

    # Junta todos os nomes de features em um único array
    todos_nomes = np.concatenate([tfidf_nomes, ohe_nomes, num_nomes])

    # Pega os valores de importância de cada feature do modelo
    importancias = clf_final.feature_importances_

    # Ordena as features da mais importante para a menos importante e pega as top 15
    top_idx = np.argsort(importancias)[-15:][::-1]

    # Cria o gráfico de barras horizontais
    fig, ax = plt.subplots(figsize=(10, 5))
    # [::-1] inverte a ordem para o maior ficar no topo do gráfico
    ax.barh(todos_nomes[top_idx][::-1], importancias[top_idx][::-1], color="#2563EB")
    ax.set_title(f"Top 15 Features — {melhor_nome}", fontsize=13, fontweight="bold")
    ax.set_xlabel("Importância")
    plt.tight_layout()
    plt.savefig("importancia_features.png", dpi=150)
    plt.show()
    print("Gráfico salvo: importancia_features.png")
else:
    # Regressão Logística e SVM não têm feature_importances_
    print(f"Importância de features não disponível para {melhor_nome}")


# =============================================================================
# CÉLULA 10 — Serialização do modelo
# =============================================================================

# Monta o pacote a ser salvo em disco.
# Para o XGBoost, precisa salvar o LabelEncoder junto porque as predições
# retornam números e precisamos converter de volta para os nomes das categorias.
if melhor_nome == "XGBoost":
    pacote = {
        "pipeline":      melhor["pipeline"],  # Pipeline completa (preprocessador + modelo)
        "label_encoder": le,                  # LabelEncoder para converter números em categorias
        "modelo_nome":   melhor_nome          # Nome do modelo (para exibição no /health)
    }
else:
    pacote = {
        "pipeline":      melhor["pipeline"],  # Para os demais modelos, o LabelEncoder não é necessário
        "label_encoder": None,
        "modelo_nome":   melhor_nome
    }

# Salva o pacote inteiro em um único arquivo .joblib
# Esse arquivo é carregado pelo app.py para fazer predições
joblib.dump(pacote, "modelo_tdb.joblib")
print("Modelo serializado: modelo_tdb.joblib")

# Testa se o arquivo foi salvo corretamente carregando-o de volta
carregado  = joblib.load("modelo_tdb.joblib")
pipe_teste = carregado["pipeline"]       # Recupera a pipeline
le_teste   = carregado["label_encoder"] # Recupera o LabelEncoder (pode ser None)

# Cria um DataFrame de exemplo com uma mensagem de urgência para testar a predição
teste = pd.DataFrame([{
    "conteudo":               "Minha filha está com muita dor, precisa de ajuda urgente",
    "enviado_por":            "BENEFICIARIO",
    "canal":                  "whatsapp",
    "prioridade_atendimento": 1,
    "status_atendimento":     "ABERTO",
    "tipo_pessoa":            "CRIANCA_ADOLESCENTE",
    "gravidade":              5
}])

# Faz a predição com o modelo carregado do disco
pred_raw = pipe_teste.predict(teste)

# Se for XGBoost, converte o número de volta para o nome da categoria
if le_teste is not None:
    pred = le_teste.inverse_transform(pred_raw)
else:
    pred = pred_raw  # Para os demais modelos, já retorna o nome diretamente

# Exibe o resultado do teste final
print(f"\nTeste de predição: '{teste['conteudo'].iloc[0]}'")
print(f"Categoria prevista: {pred[0]}")
print("\nModelo pronto para uso no app.py!")