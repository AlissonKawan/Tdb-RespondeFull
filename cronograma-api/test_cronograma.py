import unittest
from unittest.mock import MagicMock, patch
from app import app, ValidacaoError, NaoEncontradoError, BancoDadosError

class TestCronogramaAPI(unittest.TestCase):

    def setUp(self):
        # Configura o cliente de testes do Flask
        self.app = app.test_client()
        self.app.testing = True

    @patch('app.get_connection')
    def test_cadastrar_tarefa_sucesso(self, mock_get_connection):
        # Mock da conexão e cursor do banco
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simula o ID retornado pela cláusula RETURNING
        mock_id_var = MagicMock()
        mock_id_var.getvalue.return_value = [42.0]
        mock_cursor.var.return_value = mock_id_var

        # Payload válido
        payload = {
            "id_voluntario": 1,
            "tipo": "Consulta",
            "dia_semana": "Segunda-feira",
            "titulo": "Atendimento odontológico",
            "descricao": "Atender paciente João",
            "prioridade": "Alta",
            "data_atividade": "26/05/2026"
        }

        response = self.app.post('/cronograma/tarefas', json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertEqual(data["id_tarefa"], 42)
        self.assertEqual(data["mensagem"], "Tarefa cadastrada com sucesso!")

        # Garante que o insert usou status inicial "Pendente"
        args, kwargs = mock_cursor.execute.call_args
        self.assertEqual(args[1][5], "Pendente") # Sexto elemento (STATUS) deve ser "Pendente"

    def test_cadastrar_tarefa_campo_obrigatorio_faltando(self):
        # Payload sem o campo obrigatório 'titulo'
        payload = {
            "id_voluntario": 1,
            "tipo": "Consulta",
            "dia_semana": "Segunda-feira",
            "prioridade": "Alta"
        }

        response = self.app.post('/cronograma/tarefas', json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["erro"], "VALIDACAO")
        self.assertIn("Campo 'titulo' é obrigatório.", data["mensagem"])

    def test_cadastrar_tarefa_dia_semana_invalido(self):
        payload = {
            "id_voluntario": 1,
            "tipo": "Consulta",
            "dia_semana": "DiaInvalido-feira",
            "titulo": "Tarefa de teste",
            "prioridade": "Alta"
        }

        response = self.app.post('/cronograma/tarefas', json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["erro"], "VALIDACAO")
        self.assertIn("Dia da semana inválido", data["mensagem"])

    def test_cadastrar_tarefa_prioridade_invalida(self):
        payload = {
            "id_voluntario": 1,
            "tipo": "Consulta",
            "dia_semana": "Segunda-feira",
            "titulo": "Tarefa de teste",
            "prioridade": "MuitoAlta"
        }

        response = self.app.post('/cronograma/tarefas', json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["erro"], "VALIDACAO")
        self.assertIn("Prioridade inválida", data["mensagem"])

    @patch('app.get_connection')
    def test_alterar_tarefa_sucesso(self, mock_get_connection):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simula que a tarefa existe no banco (retorna uma linha para o SELECT ID_TAREFA)
        mock_cursor.fetchone.return_value = [10]

        payload = {
            "tipo": "Consulta",
            "dia_semana": "Segunda-feira",
            "titulo": "Atendimento odontológico",
            "status": "Concluída",  # Enviado com acento e feminino para testar normalização
            "prioridade": "Alta"
        }

        response = self.app.put('/cronograma/tarefas/10', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["mensagem"], "Tarefa atualizada com sucesso!")

        # Garante que salvou o status normalizado para "Concluído"
        args, kwargs = mock_cursor.execute.call_args_list[-1] # Pega a chamada do UPDATE
        self.assertEqual(args[1][4], "Concluído") # Quinto elemento (STATUS) deve ser "Concluído"

    @patch('app.get_connection')
    def test_alterar_tarefa_nao_encontrada(self, mock_get_connection):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simula que a tarefa não existe no banco
        mock_cursor.fetchone.return_value = None

        payload = {
            "tipo": "Consulta",
            "dia_semana": "Segunda-feira",
            "titulo": "Tarefa",
            "status": "Pendente",
            "prioridade": "Alta"
        }

        response = self.app.put('/cronograma/tarefas/999', json=payload)
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertEqual(data["erro"], "NAO_ENCONTRADO")
        self.assertIn("Tarefa 999 não encontrada.", data["mensagem"])

    @patch('app.get_connection')
    def test_alterar_tarefa_status_invalido(self, mock_get_connection):
        payload = {
            "tipo": "Consulta",
            "dia_semana": "Segunda-feira",
            "titulo": "Tarefa",
            "status": "Em andamento",  # Status descontinuado
            "prioridade": "Alta"
        }

        response = self.app.put('/cronograma/tarefas/10', json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["erro"], "VALIDACAO")
        self.assertIn("Status inválido. Use: ['Pendente', 'Concluído']", data["mensagem"])

    @patch('app.get_connection')
    def test_excluir_tarefa_sucesso(self, mock_get_connection):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simula que a tarefa existe no banco
        mock_cursor.fetchone.return_value = [10]

        response = self.app.delete('/cronograma/tarefas/10')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["mensagem"], "Tarefa excluída com sucesso!")

    @patch('app.get_connection')
    def test_excluir_tarefa_nao_encontrada(self, mock_get_connection):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_connection.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simula que a tarefa não existe no banco
        mock_cursor.fetchone.return_value = None

        response = self.app.delete('/cronograma/tarefas/999')
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertEqual(data["erro"], "NAO_ENCONTRADO")

if __name__ == '__main__':
    unittest.main()
