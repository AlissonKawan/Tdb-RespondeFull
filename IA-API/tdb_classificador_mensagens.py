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
        "nao me atenderam de novo",
        "Pessimo pessimo pessimo",
        "ninguem responde o zap",
        "odeio esse atendimento",
        "Nao consigo agendamento",
        "esperando ha 3 horas aqui",
        "ninguem apareceu",
        "Muito ruim tudo",
        "nao gostei nada",
        "sao horriveis",
        "Horrivel o atendimento",
        "fui embora sem ser atendida",
        "nao resolveram nada",
        "me deixaram esperando e fui embora",
        "isso é uma vergonha",
        "nao voltarei mais",
        "atendimento pessimo como sempre",
        "Nao recebi resposta nenhuma",
        "nao funciona o site de vcs",
        "que atendente grosseiro meu deus",
        "tive que ir embora",
        "Fui ignorada la",
        "Nunca vi atendimento tao ruim",
        "Minha filah ficou esperando 2 horas e nada",
        "o dentista nao veio",
        "cancelaram sem avisar de novo",
        "me passaram informacao errada",
        "nao consigo falar com ninguem, fico no silencio",
        "atendimento horrivel nao recomendo",
        "terceira vez q nao me atendem",
        "vixi que demora",
        "pior atendimento da vida",
        "me senti muito mal la",
        "nao me ligaram como prometeram",
        "Ja mandei 5 mensagem e nada",
        "atendimento sem qualidade nenhuma",
        "Agendei e nao confirmaram",
        "fui mal atendida la",
        "n consigo agendar pelo site",
        "pessima organizacao",
        "Que demora absurda",
        "meu filho ta sofrendo esperando",
        "Reclamei e nao fizeram nada",
        "Perderam meu cadastro",
        "fui encaminhada errado de novo",
        "dentista atrasou 2h sem avisar",
        "Sao muito desorganizados",
        "nao me deram nem agua enquanto esperava",
        "foi horrivel essa visita",
        "Me trataram como se eu fosse burra",
        "Nao consigo contato com vcs",
        "Cada vez pior",
        "nao recomendo pra ninguem",
        "ja nao aguento mais esse atendimento",
        "O dentista foi rude com minha crianca",
        "me ligaram na hora errada",
        "nao consigo remarcar",
        "Sempre tem problema",
        "deixaram minha filha esperando so",
        "ninguem sabia de nada la",
        "atendimento precario demais",
        "pedi ajuda e ningueam ajudou",
        "Fui tratada com descaso",
        "tentei ligar 20 vezes e nao atenderam",
        "Me colocaram no lugar errado",
        "nao tenho palavras pra descrever como foi ruim",
        "me fizeram voltar de graça",
        "passei vergonha la na frente de todos",
        "me trataram feio",
        "Muito decepcionada",
        "nao to satisfeita com esse servico nao",
        "q absurdo esse atendimento",
        "me atenderam muito mal la",
        "nao resolveram o meu problema",
        "nao tem organizacao nenhuma",
        "me fizeram esperar muito e nada",
        "o dentitsa nao apareceu de novo",
        "q falta de respeito comigo",
        "nao gostei mesmo",
        "eles me trataram pessimo",
        "meu filho ficou sem atendimento de novo",
        "uma hora de espera e nada",
        "nao tem como entrar em contato",
        "cancelaram tudo de ultima hora",
        "meu caso ta parado ha semanas",
        "nao me ajudaram em nada",
        "voltei com a mesma duvida sem resposta",
        "atendimento demorou demais pra caso simples",
        "me deixaram sem informacao nenhuma",
        "nao confio mais nesse servico",
        "a voluntaria foi grossa comigo",
        "nao recebo retorno de forma alguma",
        "me repetiram pedido de docs que já entreguei",
        "passaram meu horario pra outro sem avisar",
        "nao consigo agendar de jeito nenhum",
        "Fui embora sem resolver mais uma vez",
        "que falta de cuidado com a gente",
        "Ninguem sabia o que estava fazendo",
        "minha consulta sumiu do sistema",
        "eles estao me ignorando ha dias",
        "Que atendimento desorganizado meu Deus",
        "a sala de espera estava suja e feia",
        "ninguem me deu satisfacao alguma",
        "nao tem cuidado com as criancas aqui",
        "nunca vi atendimento tao confuso",
        "me enganaram sobre o horario",
        "a minha ficha sumiu la",
        "fui mal recebida na entrada",
        "passaram errado as instrucoes pra mim",
        "me mandaram embora sem atender",
        "o voluntario falou errado sobre meu caso",
        "ficam mudando as regras toda hora",
        "nao consigo cancelar pelo site",
        "me deixaram sem saber o que fazer",
        "perdi duas horas la pra nada",
        "atendemeto ruim e descuidado",
        "nao fui tratada com respeito",
        "o local estava fechado quando cheguei",
        "tive que adivinhar o que fazer sozinha",
        "nao me informaram nada",
        "nao voltarei nessa unidade",
        "saí la pior do que entrei",
        "minha filha ficou assustada com a forma que falaram",
        "o sistema nao aceitou meu cadastro",
        "a comunicacao de vcs e muito ruim",
        "ninguem me orientou antes do procedimento",
        "colocaram meu filho na fila errada",
        "perdi o dia de trabalho e nao fui atendida",
        "me deixaram com duvidas sobre o tratamento",
        "o atendente foi impatiente e grosseiro",
        "nao resolveram o problema raiz",
        "fui embora com raiva do atendimento",
        "cada vez mais dificil conseguir vaga",
        "marquei e nao ficou registrado",
        "nao me chamaram sendo que ja estava la",
        "me disseram uma coisa e fizeram outra",
        "fui a terceira vez e mesma coisa",
        "o voluntario nao escutou o que eu falei",
        "nao tem acesso facil pro local",
        "esperava mais de um servico assim",
        "minha consulta ja foi cancelada 2 vezes",
        "a fila nao tem organizacao nenhuma",
        "ninguem me recebeu quando cheguei",
        "o email que mandei ficou sem resposta",
        "nao consigo informacao sobre meu caso",
        "fiquei la mais de 2h sem explicacao",
        "meu caso foi enviado pro lugar errado",
        "liguei varias vezes e ninguem atendeu",
        "me enviaram pro lugar errado de proposito",
        "o sistema travou e perdi meu horario",
        "o dentista nao se apresentou",
        "nao achei o local com as instrucoes dadas",
        "me colocaram pra esperar sem explicar",
        "nao gostei do jeito que fui tratada",
        "nao me deram retorno do meu caso",
        "fui desconsiderada la na frente de todos",
        "o servico esta muito aquem do esperado",
        "me fizeram ficar esperando sem motivo",
        "minha filha saiu sem atendimento completo",
        "nao tive acesso ao responsavel do meu caso",
        "q descuido com a nossa situacao",
        "me senti abandonada la dentro",
        "pior experiencia que tive num atendimento",
        "nao tem jeito de reclamar la",
        "nao solucionaram nada do meu caso",
        "me trataram com indiferenca total",
        "que servico frustrante",
        "minha crianca ficou com medo do lugar",
        "voltei de maos vazias depois de horas",
        "nao consigo noticias do meu caso",
        "o atendimento nao foi compativel com minha necessidade",
        "foi muito ruim voltarei nao",
        "o site de vcs nao funciona direito",
        "nao me deram opcao de horario",
        "fui encaminhada errada e perdi a viagem",
        "ficaram me enrolando sem resolucao",
        "nao me avisaram sobre mudanca de local",
        "me passaram numero errado de contato",
        "minha consulta foi esquecida no sistema",
        "o voluntario foi indelicado e arrogante",
        "nao tenho como acessar meu historico",
        "me fizeram preencher tudo de novo sem motivo",
        "nao resolvi nada mesmo indo pessoalmente",
        "que falta de comunicacao entre a equipe",
        "minha filha ficou com duvida e ninguem ajudou",
        "me mandaram pro local errado duas vezes",
        "senti que ninguem queria me atender",
        "o atendimento foi desrespeitoso",
        "nao cumpriram o que prometeram",
        "me senti um fardo pra eles",
        "atendimento lento e descuidado",
        "fui atendida mas nao resolvi o problema",
        "me cobram doc diferente toda vez",
        "nao tem como agendar online",
        "que demora enorme pra simples resposta",
        "minha filha saiu da consulta sem entender nada",
        "me deram retorno errado sobre meu caso",
        "fui pro local e estava tudo fechado",
        "atendimento aquem do esperado",
        "nao confio mais nas informacoes que dao",
        "Que experiencia horrivel",
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
        "O dentista foi muito cuidadoso com minha filha adoramos",
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
        "mt bom o atendimento",
        "amei demais!!!",
        "top demais o servico",
        "Uau adorei tudo",
        "otimo obrigada",
        "muito bom mesmo",
        "parabens pra vcs",
        "adorei o atendimento",
        "que gente boa!",
        "meu filho adorou",
        "show de bola",
        "otimo servico!",
        "Melhor atendimento",
        "Maravilhoso demais",
        "perfeito 10/10",
        "Gostei muito do servico",
        "muito obrigada a todos",
        "minha filha adorou a doutora",
        "Excelentes profissionais",
        "Que atendimento lindo",
        "muito humanizado gostei",
        "Nota mil",
        "nunca fui tao bem tratada",
        "mt atenciosos",
        "foi incrivel",
        "Voltaria mil vezes",
        "q gentileza impressionante",
        "Servico incrivel e de graca ainda",
        "Deus abencoe vcs",
        "muito feliz com o resultado",
        "Que time dedicado",
        "Meus parabens a todos",
        "atendimento rapido e eficiente",
        "Que surpresa boa",
        "ficou excelente o tratamento",
        "amei a equipe",
        "foi muito melhor do que esperava",
        "Sao anjos esses dentistas",
        "Que projeto lindo",
        "muito aconchegante o lugar",
        "recomendo de olhos fechados",
        "minha filha finalmente ta bem",
        "incrivel como se dedicam",
        "Gente muito boa",
        "que atendentes maravilhosos",
        "amo vcs!",
        "meu filho ta super feliz",
        "Nota 10 com folga",
        "Que experiencia incrivel",
        "Gratidao eterna",
        "muito atencioso e dedicado",
        "Voluntarios incriveis",
        "q servico bom esse",
        "meu filho sorriu o tempo todo la",
        "Que bom encontrar gente assim",
        "top vcs sao demais",
        "Adorei e meu filho amou tambem",
        "que atendimento incrivel mesmo",
        "vcs sao os melhores mesmo",
        "equipe muito boa e cuidadosa",
        "saimos muito felizes daqui",
        "Tratamento perfeito parabens",
        "Excelente trabalho voluntario",
        "Que gente dedicada e carinhosa",
        "minha filha ta bem e muito feliz",
        "fui surpreendida positivamente",
        "o dentista e muito bom",
        "atendimento feito com amor",
        "Realmente faz diferenca na nossa vida",
        "que projeto lindo que vcs tem",
        "foi tudo perfeito do inicio ao fim",
        "o local e limpo e agradavel",
        "o atendente foi mt paciente com meu filho",
        "Muito carinhosos com as criancas",
        "Que profissionalismo incrivel",
        "gostei muito de tudo",
        "meu filho sorriu o tempo todo",
        "foi além das expectativas",
        "equipe unida e muito eficiente",
        "Que equipe incrivel parabens a todos",
        "ficamos muito satisfeitas",
        "nunca vi cuidado assim com crianca",
        "atendimento humanizado de verdade",
        "q coisa linda vcs fazem",
        "tratamento excepcional parabens",
        "Meu filho ja nao tem mais dor",
        "Impressionante a qualidade aqui",
        "Deus abencoe essa equipe toda",
        "nunca me senti tao acolhida",
        "atendimento top obrigada de coracao",
        "amo demais esse servico",
        "que sorriso lindo saiu daqui",
        "trabalho lindo e muito necessario",
        "cada detalhe foi perfeito",
        "atencao e cuidado nao faltaram",
        "Nota 1000 pra vocês",
        "nunca vi tanta dedicacao assim",
        "melhor servico gratuito que existe",
        "Gratidao enorme com todo mundo",
        "fiquei muito emocionada com o carinho",
        "sem palavras de tao bom que foi",
        "a doutora conquistou a confianca do meu filho",
        "Que recepcionista gentil e querida",
        "minha filha nao queria ir mas amou",
        "cuidaram muito bem de nos",
        "que atendimento cuidadoso",
        "Parabens a dentista nota 10",
        "servico feito com muito amor",
        "que gentileza de todos",
        "A equipe e ótima",
        "muito bem atendida obrigada",
        "orgulho de existir um servico assim",
        "que tratamento maravilhoso",
        "dentista muito habilidosa e gentil",
        "equipe de primeiro time",
        "atendimento impecavel e cuidadoso",
        "que eficiencia e carinho",
        "o atendimento foi rapido e excelente",
        "meu filho quer voltar logo",
        "confiamos muito no trabalho de vcs",
        "Que time de voluntarios dedicados",
        "saimos sorrindo e gratos",
        "tratamento com carinho e competencia",
        "que resultado lindo no tratamento",
        "o melhor que poderia ter acontecido",
        "que alegria de ter esse servico aqui",
        "muito eficiente e muito humano",
        "Que abençoadas somos de ter isso",
        "atenderam o meu filho como rei",
        "que experiencia positiva demais",
        "meu filho ta sem dor e sorrindo muito",
        "obrigada pela paciencia e cuidado",
        "vocês fazem milagres mesmo",
        "o projeto mais importante da cidade",
        "fiquei sem palavras de tao bom",
        "que dentista incrivel e amorosa",
        "minha filha pediu pra voltar la",
        "muito feliz com esse atendimento",
        "Que servico excelente e de graca",
        "cuidaram muito bem da minha filha",
        "nao esperava tamanha qualidade",
        "que recebimento caloroso e gentil",
        "Que surpresa agradável este serviço",
        "que consulta perfeita foi essa",
        "equipe amorosa e muito capaz",
        "voltamos de casa super felizes",
        "ja recomendei para toda minha familia",
        "melhor projeto que conheci",
        "fiquei emocionada com o cuidado",
        "que dentistas excelentes",
        "meu filho ficou fala que fala do dentista",
        "que gentileza e carinho da equipe",
        "minha filha adorou a doutora nova",
        "que profissionais competentes",
        "atendimento com muito amor e cuidado",
        "nunca fui tao bem cuidada",
        "muito feliz com tudo",
        "que atendimento lindo parabens",
        "perfeito do comeco ao fim",
        "adorei cada momento la",
        "que consulta incrivel",
        "meu filho ficou muito a vontade",
        "que acolhimento maravilhoso",
        "equipe nota mil parabens",
        "Que atendimento especial e diferenciado",
        "que experiencia linda esse servico",
        "minha crianca ficou sem medo do dentista",
        "Gente boa e competente so aqui",
        "que cuidado precioso com a gente",
        "obrigada pela dedicacao de todos",
        "que atendimento completo e humanizado",
        "que orgulho de vcs existirem aqui",
        "que voluntarios dedicados obrigada",
        "meu filho saiu radiante e feliz",
        "que tratamento bonito fizeram",
        "recebimento caloroso e respeitoso",
        "que sensibilidade da equipe",
        "nunca vi tanto cuidado em gratuito",
        "que voluntario dedicado e prestativo",
        "saimos com muito carinho daqui",
        "que trabalho de excelencia",
        "muito bem atendida em todos os detalhes",
        "que atendimento com alma e coracao",
        "minha filha ficou sorrindo de orelha a orelha",
        "que servico extraordinario",
        "que acolhida carinhosa foi essa",
        "nunca imaginei gostar tanto de ir ao dentista",
        "que felicidade de encontrar gente assim",
        "que profissionais magnificos parabens",
        "minha filha ficou encantada com o dentista",
        "que historia linda de voluntariado",
        "que servico essencial e lindo",
        "parabens a cada um de voces",
        "que atencao especial me deram",
        "nunca fui tao bem acolhida",
        "que projeto transformador incrivel",
        "mto bom o atendimento, to feliz demais",
        "vcs são os melhores!!",
        "otimo servico parabens a todos",
        "minha filha adorou a consulta, muito obrigada",
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
        "podia ter mais horario",
        "seria bom ter app",
        "Podia ter estacionamento",
        "Precisamos de mais voluntarios",
        "seria bom ter wifi la",
        "deviam mandar lembrete",
        "pode melhorar a sala de espera",
        "Seria bom ter mais vagas",
        "precisa de mais dentistas",
        "colocassem aviso de horario no site",
        "Um app facilitaria muito",
        "colocassem mais cadeiras la",
        "era bom ter video sobre os procedimentos",
        "que tal atender por video?",
        "Podem adicionar um chat no site",
        "seria boa ideia um grupo de pais",
        "poderiam abrir filial perto da escola",
        "seria interessante ter mais canais",
        "deviam ter mais dias disponiveis",
        "Podiam ter um numero de emergencia",
        "uma lista de docs ajudaria muito",
        "seria bom ter cadastro online",
        "adicionar mais pontos de atendimento",
        "seria util ter instrucoes pos consulta",
        "tinha que ter retorno automatico",
        "podia ter atendimento na creche",
        "seria bom ter dicas de saude bucal",
        "deviam mandar foto do dentista antes",
        "precisa de sala de espera infantil",
        "Era bom ter pesquisa de satisfacao",
        "podia ter atividades pras criancas esperando",
        "tem que melhorar o site",
        "seria bom ter consulta domiciliar",
        "devia ter guia de primeiros socorros",
        "era legal ter tutorial de como agendar",
        "precisam de espaco maior",
        "colocar o endereco no google maps",
        "podia ter um chatbot pra tirar duvida",
        "melhorar o formulario online",
        "seria otimo ter mais voluntarios",
        "deviam ter dias fixos de atendimento",
        "seria bom avisar quando tiver vaga",
        "podiam ter mais opcoes de canal de contato",
        "Deviam ter mais dias de atendimento",
        "seria bom ter atendimento domiciliar",
        "Colocassem mais informacoes no site",
        "seria util ter um numero de urgencia 24h",
        "deveriam ter mais voluntarios",
        "seria bom ter atendimento via instagram",
        "Podiam ter sala especifica para crianca",
        "seria otimo ter mais unidades",
        "tinha que ter area de lazer para criancas",
        "podiam ter retorno automatico por wpp",
        "melhorar o processo de agendamento",
        "deveriam simplificar o formulario",
        "era bom ter tutorial de uso do site",
        "colocassem confirmacao automatica por email",
        "seria util ter chatbot no site",
        "podiam ter FAQ com duvidas frequentes",
        "seria bom ter atendimento em libras",
        "era legal ter mapa do percurso ate o local",
        "deveriam ter materiais educativos",
        "ter uma linha de atendimento exclusiva",
        "seria bom ter acompanhamento digital",
        "podiam ter programa de prevencao bucal",
        "era bom ter dentista especialista em crianca",
        "deviam ter parceria com escolas",
        "seria otimo ter visita as comunidades",
        "podiam ter mais pontos de coleta de docs",
        "seria bom ter um canal no telegram",
        "era legal ter grupo de pais no whatsapp",
        "deveriam criar um programa de saude bucal",
        "podiam enviar dicas de higiene bucal",
        "era bom ter mais vagas por dia",
        "deviam ter atendimento prioritario pra idosos",
        "seria bom ter avaliacao pos atendimento",
        "podiam ter parceria com ubs da regiao",
        "era legal ter video explicando o atendimento",
        "seria util ter notificacoes de vaga disponivel",
        "deveriam melhorar o site mobile",
        "podiam ter indicacao de onibus e metro",
        "era bom ter mais canais de comunicacao",
        "deviam ter um programa de fidelizacao",
        "seria bom ter historico de consultas online",
        "podiam ter lista de espera online",
        "era legal criar um clube de saude bucal",
        "seria bom ter mais recursos disponiveis",
        "deviam criar um portal do beneficiario",
        "seria util ter um numero unico de contato",
        "podiam ter servico de traducao",
        "era bom ter mais informacoes no wpp",
        "deviam ter parcerias com farmacias",
        "seria bom ter kit higiene bucal",
        "podiam ter mais eventos na comunidade",
        "era legal ter manual do beneficiario",
        "seria bom ter mais vagas no horario da noite",
        "podiam ter programa de orientacao nutricional",
        "era bom ter botao de emergencia no app",
        "deviam ter agenda publica de atendimentos",
        "seria util ter canal exclusivo de agendamento",
        "podiam ter voluntario dedicado a crianca",
        "era bom ter apoio psicologico junto ao dentario",
        "seria bom ter carta de servicos impresso",
        "podiam ter pagina de depoimentos no site",
        "era legal divulgar o servico em escolas",
        "deviam ter convencio com a prefeitura",
        "seria bom ter mais instrutores de higiene",
        "podiam ter ficha de encaminhamento medico",
        "era bom ter mais feedback do tratamento",
        "seria util ter protocolo de urgencia divulgado",
        "podiam ter espaco de descanso pra mes",
        "era bom ter boletim informativo mensal",
        "deviam ter parceria com transporte publico",
        "seria util ter lista de espera unificada",
        "podiam ter atendimento em creches",
        "era legal ter programa de escovacao em grupo",
        "seria bom ter lembrete de consulta por sms",
        "deviam ter mapa dos pontos de atendimento",
        "podiam ter atendimento no parque",
        "era bom ter parceria com hospitais regionais",
        "seria util ter acompanhamento via email",
        "podiam ter treinamento online para pacientes",
        "era legal ter canal de voluntariado no site",
        "seria bom ter blog de saude bucal",
        "deviam ter suporte fora do horario comercial",
        "podiam ter aviso de nova vaga por zap",
        "era bom ter parceria com ong local",
        "seria util ter formulario pre atendimento online",
        "podiam ter guia de procedimentos",
        "era bom ter newsletter de saude",
        "deviam ter feedback individual pos consulta",
        "seria bom ter parceria com educacao",
        "podiam ter convenio com assistencia social",
        "era legal ter espaco de leitura na espera",
        "seria bom ter atendimento em feriados",
        "era bom ter convenio com transporte",
        "seria bom ter sala de alleitamento",
        "podiam ter protocolo claro de urgencias",
        "era legal criar app de monitoramento",
        "deviam ter mais voluntarios formados",
        "seria otimo ter parceria com secretaria de saude",
        "podiam ter reuniao de pais periodicamente",
        "era bom ter atendimento itinerante",
        "deviam ter helpdesk disponivel",
        "seria util ter agenda compartilhada online",
        "podiam ter mais dias de plantao",
        "era bom ter suporte emocional disponivel",
        "deviam ter mais atividades preventivas",
        "seria bom ter canal de contato para pais",
        "podiam ter cadastro simplificado",
        "era legal ter sorteio de consultas",
        "deviam ter espaco para bebes",
        "seria bom ter ficha de acompanhamento impresso",
        "podiam ter recursos pedagogicos",
        "era bom ter laboratorio proximo",
        "deviam ter plano de tratamento escrito",
        "seria util ter cartilha de higiene bucal",
        "podiam ter acesso a historico pelo celular",
        "era bom ter rede de parceiros ampliada",
        "deviam ter programa de prevencao escolar",
        "seria bom ter mais divulgacao do projeto",
        "podiam ter fila prioritaria online",
        "era legal ter painel de espera digital",
        "deviam ter sistema de avaliacao simples",
        "seria bom ter canal direto com o dentista",
        "podiam ter plano terapeutico compartilhado",
        "era bom ter registro do tratamento em pdf",
        "deviam ter material sobre higiene pra crianca",
        "seria bom ter atendimento de segunda a segunda",
        "podiam ter triagem online antes da consulta",
        "era legal ter programa de radio sobre saude",
        "deviam ter link direto pra agendar no site",
        "seria bom ter grupo de whatsapp de suporte",
        "podiam ter kits de higiene bucal doados",
        "era bom ter instrucoes pos procedimento por escrito",
        "deviam ter parceria com pedagogos",
        "seria util ter hotline de tiragem de duvida",
        "podiam ter mais cursos pro voluntarios",
        "era bom ter boletim de saude das criancas",
        "deviam ter mais eventos em comunidades",
        "seria bom ter parceria com ong de infancia",
        "podiam ter avaliacao de saude bucal anual",
        "era legal ter kit de cuidados pos consulta",
        "deviam ter consultores de saude bucal",
        "seria bom ter parceria com defensoria publica",
        "podiam ter registro em prontuario eletronico",
        "era bom ter servico de orientacao nutricional",
        "deviam ter mais unidades moveis de atendimento",
        "seria util ter prontuario impresso disponivel",
        "podiam ter parceria com ubs proximas",
        "era bom ter mais esclarecimentos ao final",
        "deviam ter espaco de recreacao na espera",
        "seria bom ter cronograma de atendimento publico",
        "podiam ter painel com informacoes no local",
        "era legal ter programa de apadrinhamento",
        "deviam ter canal de sugestoes do beneficiario",
        "seria bom ter farmacia social conveniada",
        "podia ter mais horario disponivel no app",
        "seria bom manda lembrete de consulta no zap",
        "sugiro ter atendimento noturno tbm",
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
        "socorro meu filho ta com muita dor",
        "dor demais preciso de ajuda ja",
        "Urgente por favor!!!",
        "minha filha ta chorando de dor",
        "meu filho ta com febre e inchaço",
        "dor insuportavel socorro",
        "Preciso de ajuda urgente hoje",
        "nao aguenta mais de dor",
        "crianca com dor forte na boca",
        "socorro preciso de atendimento",
        "meu filho ta com muito inchaço",
        "emergencia bucal agora",
        "dente sangrado nao para",
        "crianca com febre e dor horrivel",
        "preciso atendiemento urgente",
        "meu filho ta em desespero",
        "e grave precisa de ajuda rapido",
        "minha menina ta sofrendo muito",
        "Dente torto sangrado urgente",
        "ta muito grave nao aguenta mais",
        "crianca com abscesso pedindo ajuda",
        "meu filho ta mal precisa urgente",
        "nao dorme de dor ha dois dias",
        "Crianca com sangramento urgente",
        "bochecha inchada feve muito urgente",
        "socorro ela ta chorando la em casa",
        "nao consigo parar o sangramneto",
        "preciso hoje senao fica pior",
        "minha filha ta em colapso de dor",
        "dente quebrado acidente agora a pouco",
        "e crianca de 3 anos com dor forte",
        "ela ta com pus na gengiva socorro",
        "nao consigo nem dar agua de tanta dor",
        "Infeccao boca crianca urgentissimo",
        "meu filho caiu bateu os dente ta sangrando",
        "dor desde ontem crianca ta piorando",
        "preciso atendimento emergencia hoje",
        "crianca nao consegue comer de dor",
        "ta com febre alta e a boca inchada",
        "e urgente preciso de dentista agora",
        "nao sei o q fazer ta com muita dor",
        "Sangramento e dor muita urgente",
        "minha filha esta piorando rapido",
        "situacao critica precisamos de ajuda",
        "meu filho ta muito mal com dor",
        "preciso de socorro hoje mesmo",
        "ela ta com febre e dor muito forte",
        "crianca em colapso de dor socorro",
        "urgente preciso agora",
        "dente sangando sem parar",
        "meu filho nao para de chorar",
        "infeccao no dente e febre",
        "e urgente por favor",
        "bochecha inchada nao consigo dormir",
        "crianca chorando de dor ha horas",
        "preciso de medico urgente bucal",
        "situacao piorou muito preciso de ajuda",
        "sangramento e pus na gengiva urgente",
        "dente quebrado e sangrando muito",
        "crianca com dor intensa no ouvido e dente",
        "preciso de atendimento hoje sem falta",
        "situacao critica com abscesso",
        "nao consigo nem comer de dor",
        "Urgente crianca bateu dente e sangrou",
        "socorro a bochecha inchada feio",
        "meu filho ta com pus e febre ha 2 dias",
        "crianca com dor insuportavel socorro",
        "preciso de ajuda nao aguenta mais",
        "dente infeccionado situacao grave",
        "ela nao come nao dorme de dor",
        "socorro minha crianca ta muito mal",
        "urgente precisamos hoje mesmo",
        "dor muito forte crianca nao consola",
        "rosto inchado febre e dor e urgente",
        "crianca caiu bateu os dentes urgente",
        "nao aguenta a dor precisa de socorro",
        "inflamacao grave na boca crianca",
        "crianca com trauma dental urgente",
        "preciso de atendimento nao pode esperar",
        "minha filha ta com a boca sangrando",
        "e critica a situacao dela socorro",
        "urgentissimo nao sei o q fazer",
        "crianca com calafrio e dor no dente",
        "o inchaço ta se espalhando preciso de ajuda",
        "ela ta em desespero de dor socorro",
        "emergencia dental crianca 5 anos",
        "nao pode esperar e muito grave",
        "boca sangrando muito nao sei o q fazer",
        "pus no dente crianca precisa urgente",
        "ela ta com febre alta desde ontem",
        "crianca recusando comer beber de dor",
        "preciso urgente consulta emergencial",
        "meu filho ta com o rosto muito inchado",
        "crianca com dor nas costas e no dente",
        "nao consegue abrir a boca de dor",
        "socorro e muito urgente mesmo",
        "ela ta chorando desde madrugada",
        "dente infeccionado crianca pequena urgente",
        "crianca vomitou de tanta dor",
        "preciso do dentista hoje mesmo urgente",
        "Urgente situacao piorou na ultima hora",
        "meu filho ta com a gengiva com pus",
        "socoro crianca ta passando mal",
        "dor horrivel desde sexta socorro",
        "crianca com trauma nos dentes urgente",
        "nao para de sangrar desde hoje cedo",
        "e grave demais preciso de socorro hj",
        "preciso urgente e e crianca pequena",
        "dor intensa meu filho ta em pânico",
        "crianca pequena com dente infeccionado",
        "socorro dente ta caindo e sangrando",
        "precisamos de ajuda nao pode esperar",
        "minha filha nao dorme ha 2 noites",
        "urgente bochecha inchada crianca",
        "dor fortissima preciso agora mesmo",
        "socorram minha crianca ta muito mal",
        "e critica precisa de ajuda hj",
        "Crianca com abscesso urgente socorro",
        "dor desde a madrugada nao para",
        "meu filho ta com febre e dor juntos",
        "urgentissimo crianca precisa de socorro",
        "nao para de chorar de dor desde ontem",
        "inchaço enorme no rosto e febre alta",
        "crianca em crise de dor agora",
        "e emergencia bucal crianca",
        "preciso de dentista urgente hoje",
        "sangramento bucal que nao cessa",
        "meu filho ta com dor fortissima socorro",
        "Urgente nao aguenta de dor",
        "crianca com inflamacao no rosto urgente",
        "dente fraturado urgente crianca",
        "crianca com calafrio e abscesso bucal",
        "preciso de socorro urgente agora mesmo",
        "e grave e crianca de 4 anos",
        "sangrou muito e nao parou ainda",
        "minha filha ta desidratada de tanto choro",
        "urgente crianca com pus e febre",
        "a dor piorou muito nas ultimas horas",
        "crianca com trauma dental socorro",
        "meu filho ta sem conseguir falar direito",
        "ela nao quer nem tomar agua de dor",
        "precisa de atendimento emergencial hoje",
        "urgente situacao que nao pode esperar",
        "inchaço espalhando no pescoco urgente",
        "crianca nao come beber nem dormir de dor",
        "socorro e critica a situacao",
        "dente quebrado sangrando crianca precisa ajuda",
        "crianca com calafrio dor febre e pus",
        "precisa de socorro imediato nao aguenta",
        "e urgente o inchaço ta crescendo",
        "dente infectado crianca urgentissimo",
        "socorro e muito grave precisa hoje",
        "meu filho ta com a bochecha piorando",
        "crianca ta em sofrimento intenso socorro",
        "preciso do dentista agora nao pode esperar",
        "urgente ela ta com muita febre e dor",
        "socorro crianca com infeccao bucal agora",
        "dor insuportavel preciso de ajuda hoje",
        "urgente inflamacao no pescoco crianca",
        "minha filha ta chorando sem parar de dor",
        "crianca com trauma e sangramento urgente",
        "e urgente crianca nao aguenta mais",
        "ela ta com febre alta e inchaço agora",
        "crianca ta inconsolavel de tanta dor",
        "urgente dente de leite infeccionado crianca",
        "preciso de atendimento imediato agora",
        "meu filho ta com o rosto muito ruim",
        "situacao piorando rapido urgente socorro",
        "crianca com sangramento que nao cessa",
        "ela ta em desespero preciso de ajuda",
        "dente exposto e sangrando urgente hoje",
        "preciso de consulta emergencial sem falta",
        "crianca vomitando de dor no dente",
        "urgentissimo inchaço no rosto crianca",
        "precisa atendimento imediato nao pode esperar",
        "meu filho ta com o pescoço inchado urgente",
        "crianca com abscessos urgente socorro",
        "febre alta e inchaço bucal urgentissimo",
        "minha filha ta em choque de dor",
        "ta com mta dor",
        "socorro",
        "dor demais ajuda",
        "preciso agora",
        "urgente!!",
        "criança com dor forte",
        "nao aguento a dor",
        "minha filha ta choraando mto precisa de consulta hj",
        "dor insuportavel nao tenho mais como aguentar socorro",
        "meu filho n para de chora de dor desde ontem to desesperada",
        "inchaço na gengiva ta enorme e com febre precisa urgente",
        "ta muito mal precisamo de ajuda rapido pf",
        "vc pode me atende hj?? ta com muita dor",
        "criança com febre e dor dente muito ruim",
        "preciso de consulta de emergencia hj",
        "nao to conseguindo comer de tanta dor",
        "minha mae ta com dor fortissima precisa de ajuda urgente",
        "abcesso dentario preciso de atendimento hoje",
        "tem algum dentista disponível agora ta muito mal",
        "dor de dente 3 dias to no limite me ajuda",
        "filho gritando de dor preciso de alguem agora",
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
        "confirmo a consulta",
        "vou la amanha",
        "ok recebido obrigada",
        "tudo certo com o agendamento",
        "quais documentos levo?",
        "q hora e o atendimento?",
        "qual o endereco mesmo?",
        "vcs atendem sabado?",
        "quero remarcar",
        "vou chegar atrasada uns 10 min",
        "posso levar meu outro filho junto?",
        "o servico e gratuito ne?",
        "to mandando os documentos",
        "chegamos",
        "receberam minha mensagem?",
        "ja fiz o cadastro",
        "confirma meu horario por favor",
        "qual o numero de vcs?",
        "vcs tem vaga essa semana?",
        "mandei os exames",
        "preciso cancelar a consulta",
        "como funciona o atendimento?",
        "tem vaga ainda?",
        "oi boa tarde quero agendar",
        "vcs atendem crianca de 1 ano?",
        "estou retornando a ligacao",
        "meu tel mudou o novo e esse aqui",
        "vou levar o cartao de saude",
        "ta tudo certo com o tratamento",
        "preciso de declaracao de atendimento",
        "posso ir de manha?",
        "e de graca esse servico?",
        "ok estarei la",
        "como faz pra agendar pela primeira vez?",
        "qual onibus pega pra chegar?",
        "quero atualizar meu email",
        "minha filha ta bem obrigada",
        "recebi o email confirmo sim",
        "quantas consultas sao necessarias?",
        "preciso de segunda via do comprovante",
        "oi to aqui no local",
        "enviando foto do dente",
        "q horario tem disponivel essa semana?",
        "posso remarcar pra depois de amanha?",
        "vcs aceitam crianca de 18 meses?",
        "qual e o canal certo pra mandar doc?",
        "o atendimento e somente presencial?",
        "preciso de informacao sobre o tratamento",
        "quero saber sobre o proximo passo",
        "Confirmo presenca amanha",
        "vou enviar o exame em seguida",
        "o meu cadastro foi concluido?",
        "to aqui no local aguardando",
        "pode confirmar o horario de hoje?",
        "vou so confirmar minha presenca",
        "recebi a confirmacao obrigada",
        "ja enviei todos os documentos",
        "quero saber se posso ir sabado",
        "meu filho ta bem obrigada",
        "o tratamento ta andando bem",
        "preciso do comprovante de atendimento",
        "esta e minha primeira vez como vai funcionar",
        "Podem confirmar que receberam os docs?",
        "posso trazer minha vizinha junto?",
        "vcs atendem quem mora em outro bairro?",
        "ok estarei la no horario combinado",
        "tenho que faltar posso remarcar?",
        "qual e o tempo de espera normalmente?",
        "meu cadastro foi atualizado?",
        "Oi to retornando o contato",
        "pode me passar o numero do dentista?",
        "meu filho ja tomou todos os remedios",
        "o atendimento pode ser feito de tarde?",
        "preciso do relatorio do atendimento",
        "recebi o resultado pode confirmar?",
        "vou atrasar uns 15 min avisando antes",
        "posso agendar mais de uma crianca?",
        "qual o nome do responsavel pelo meu caso?",
        "vcs fazem atendimento fora da cidade?",
        "o retorno e automatico ou manual?",
        "ja confirmei meu agendamento sim",
        "pode me dar mais detalhes do proximo passo?",
        "preciso do historico das consultas",
        "posso mudar o horario dessa semana?",
        "quando sai o resultado do exame?",
        "estou enviando o formulario preenchido",
        "qual e o endereco exato do local?",
        "tem atendimento disponivel essa semana?",
        "posso ligar pra confirmar o horario?",
        "qual o horario de funcionamento sabado?",
        "ok recebi a confirmacao",
        "posso agdar com menos de 24h?",
        "vou levar os exames antigos tambem",
        "quero saber se meu caso foi aceito",
        "q documentos sao necessarios novamente?",
        "preciso confirmar a proxima consulta",
        "o tratamento ja encerrou ou tem mais?",
        "vcs tem atendimento em julho?",
        "precisaria de outro horario mais cedo",
        "enviando o laudo conforme solicitado",
        "ok confirmei tudo",
        "vou chegar mais cedo ta bom?",
        "tenho duvida sobre o retorno pos consulta",
        "pode me avisar quando tiver vaga?",
        "preciso de informacao sobre o tratamento completo",
        "vou enviar foto do dente em seguida",
        "recebi o horario confirmado",
        "preciso de orientacao sobre cuidados em casa",
        "Quero confirmar minha vaga para amanha",
        "ja fiz o cadastro espero o retorno",
        "so queria saber o que levo amanha",
        "qual e a duracao media do tratamento?",
        "preciso de retorno sobre meu agendamento",
        "minha filha vai bem no tratamento obrigada",
        "to enviando os documentos solicitados",
        "posso levar a crianca sem agendamento?",
        "vcs tem vaga pra crianca especial?",
        "o local e de facil acesso?",
        "quero saber como e o primeiro atendimento",
        "posso vir com meu bebe de colo?",
        "vcs tem lista de espera?",
        "qual e o tempo medio de espera la?",
        "minha filha foi bem e mando o resultado",
        "preciso saber se faço exame antes",
        "Confirmo minha presenca amanha cedo",
        "pode me dizer os documentos corretos?",
        "o que faco se chegar atrasada?",
        "vou enviar o formulario ainda hoje",
        "ja atualizei o cadastro por email",
        "vcs atendem pelo sus ou particular?",
        "preciso saber o valor das consultas",
        "o que faco pra primeiro atendimento?",
        "confirmei a consulta pelo email",
        "recebi a instrucoes obrigada vou seguir",
        "preciso do nome completo do dentista",
        "quero saber quais sao as especialidades",
        "o tratamento inclui retorno?",
        "quero informacoes sobre o inicio do tratamento",
        "enviei os exames pelo email",
        "ja fiz meu cadastro aguardo contato",
        "pode confirmar recebimento da foto?",
        "preciso de orientacao sobre higiene pos tratamento",
        "vou levar o cartao de vacinacao junto",
        "tenho interesse em conhecer o projeto",
        "como funciona o encaminhamento?",
        "preciso de informacao para indicar um amigo",
        "Poderia enviar o formulario de novo?",
        "enviando foto do local de dor conforme pedido",
        "ok ja entendi como funciona obrigada",
        "qual e o protocolo para casos especiais?",
        "vou trazer a certidao de nascimento",
        "pode me dizer qual e o canal oficial?",
        "ja entrei no site mas nao encontrei horario",
        "vcs tem retorno digital do tratamento?",
        "posso enviar doc por foto pelo zap?",
        "preciso de confirmacao do meu caso",
        "vou chegar cedo pra garantir o horario",
        "o agendamento e feito por qual canal?",
        "preciso do relatorio pra escola da minha filha",
        "quero saber se precisa de indicacao",
        "confirmo minha presenca no proximo retorno",
        "pode me enviar o numero pra emergencia?",
        "preciso de orientacoes gerais do servico",
        "vou levar cartao do sus conforme pedido",
        "quero me inscrever como beneficiaria",
        "posso agendar a consulta de retorno?",
        "qual e o periodo de funcionamento?",
        "preciso de informacoes basicas do servico",
        "recebi o lembrete e vou comparecer",
        "vou enviar os docs antes de amanha",
        "ja recebi o retorno obrigada",
        "quero saber sobre o processo de tratamento",
        "confirmo presenca para a semana que vem",
        "qual e a duracao do tratamento completo?",
        "vou trazer toda documentacao necessaria",
        "confirmo consulta amanhã",
        "vou chegar 10 min atrasado",
        "cancelar consulta",
        "quero remarcar",
        "docs enviados",
        "oi queria sabe se vcs atendem no sabado",
        "vou precisar cancela minha consulta de quinta pq surgiu algo",
        "boa tarde preciso remarcar minha cnsulta do dia 20 pf",
        "oii consigo agendar consulta pra essa semana?",
        "manda o endereço pf nao to achando",
        "qual o horario de funcionameto de vcs?",
        "posso leva meu filho menor de 1 ano?",
        "tenho conv odonto, vcs aceita?",
        "to enviando os docuemntos q pediram",
        "preciso do comprovante de atendimento",
        "não vou consegui ir na consulta de hj, pode remarcar?",
        "boa tarde minha consulta e que horas amanha?",
        "como faz pra agendar pelo whats?",
        "vcs ficam abertos no feriado?",
        "ja fui la hoje de manha mas nao tinha ninguem",
        "to mandando a foto do cartao do plano",
        "minha filha eh paciente de vcs como faz pra marcar retorno?",
        "preciso do laudo da ultima consulta pra medico",
        "confirmo presença na terca as 9h",
        "posso ir sem agendamento?",
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
    ("texto",      TfidfVectorizer(max_features=1500, ngram_range=(1, 2),
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