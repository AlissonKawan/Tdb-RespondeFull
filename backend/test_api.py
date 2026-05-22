import urllib.request
import urllib.error
import json

data = json.dumps({
    "tipo_pessoa": "OUTRO",
    "canal": "sistema_web",
    "gravidade": 0,
    "risco": 0,
    "prioridade": 3,
    "status_atendimento": "EM_ATENDIMENTO"
}).encode('utf-8')

req = urllib.request.Request("http://127.0.0.1:5000/predict_checkin", data=data, headers={"Content-Type": "application/json"})
try:
    res = urllib.request.urlopen(req)
    print(res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
