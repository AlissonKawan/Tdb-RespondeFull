package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.MensagemDAO;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.Mensagem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MensagemBOTest {

    private MensagemBO bo;
    private FakeMensagemDAO mensagemDAO;
    private FakeAtendimentoBO atendimentoBO;

    @BeforeEach
    void setUp() {
        bo = new MensagemBO();
        mensagemDAO = new FakeMensagemDAO();
        atendimentoBO = new FakeAtendimentoBO();
        bo.mensagemDAO = mensagemDAO;
        bo.atendimentoBO = atendimentoBO;
    }

    @Test
    void deveInserirMensagemValidaNormalizandoRemetente() {
        Mensagem mensagem = bo.inserir(request(1, "beneficiario", "Preciso de ajuda"));

        assertAll(
                () -> assertEquals(1, mensagem.getAtendimento().getId()),
                () -> assertEquals("BENEFICIARIO", mensagem.getEnviadoPor()),
                () -> assertEquals("Preciso de ajuda", mensagem.getConteudo()),
                () -> assertNotNull(mensagem.getDataHora()),
                () -> assertEquals(1, mensagemDAO.mensagensInseridas.size())
        );
    }

    @Test
    void deveAceitarRemetentesPermitidos() {
        assertAll(
                () -> assertEquals("BENEFICIARIO", bo.inserir(request(1, "beneficiario", "a")).getEnviadoPor()),
                () -> assertEquals("VOLUNTARIO", bo.inserir(request(1, "voluntario", "b")).getEnviadoPor()),
                () -> assertEquals("ADMIN", bo.inserir(request(1, "admin", "c")).getEnviadoPor())
        );
    }

    @Test
    void deveRecusarMensagemSemConteudoOuRemetenteValido() {
        assertAll(
                () -> assertThrows(BusinessException.class, () -> bo.inserir(request(1, "admin", " "))),
                () -> assertThrows(BusinessException.class, () -> bo.inserir(request(1, "desconhecido", "texto"))),
                () -> assertThrows(BusinessException.class, () -> bo.inserir(request(1, null, "texto")))
        );
    }

    @Test
    void deveRecusarMensagemParaAtendimentoEncerradoOuCancelado() {
        atendimentoBO.status = "ENCERRADO";
        assertThrows(BusinessException.class, () -> bo.inserir(request(1, "admin", "texto")));

        atendimentoBO.status = "cancelado";
        assertThrows(BusinessException.class, () -> bo.inserir(request(1, "admin", "texto")));
    }

    @Test
    void deveListarMensagensDepoisDeValidarAtendimento() {
        mensagemDAO.mensagensPorAtendimento = List.of(mensagem("Oi"), mensagem("Tudo bem?"));

        List<Mensagem> mensagens = bo.listarPorAtendimento(7);

        assertAll(
                () -> assertEquals(7, atendimentoBO.ultimoIdBuscado),
                () -> assertEquals(2, mensagens.size()),
                () -> assertEquals("Oi", mensagens.get(0).getConteudo())
        );
    }

    @Test
    void deveRecusarIdDeAtendimentoInvalidoAoListar() {
        assertThrows(BusinessException.class, () -> bo.listarPorAtendimento(0));
    }

    private MensagemRequest request(Integer atendimentoId, String enviadoPor, String conteudo) {
        MensagemRequest request = new MensagemRequest();
        request.atendimentoId = atendimentoId;
        request.canalId = 2;
        request.enviadoPor = enviadoPor;
        request.conteudo = conteudo;
        return request;
    }

    private Mensagem mensagem(String conteudo) {
        Mensagem mensagem = new Mensagem();
        mensagem.setConteudo(conteudo);
        mensagem.setDataHora(LocalDateTime.now());
        return mensagem;
    }

    private static class FakeMensagemDAO extends MensagemDAO {
        private final List<Mensagem> mensagensInseridas = new java.util.ArrayList<>();
        private List<Mensagem> mensagensPorAtendimento = List.of();

        @Override
        public void inserir(Mensagem mensagem) {
            mensagensInseridas.add(mensagem);
        }

        @Override
        public List<Mensagem> buscarPorAtendimento(int atendimentoId) {
            return mensagensPorAtendimento;
        }
    }

    private static class FakeAtendimentoBO extends AtendimentoBO {
        private String status = "ABERTO";
        private int ultimoIdBuscado;

        @Override
        public Atendimento buscarPorId(int id) {
            ultimoIdBuscado = id;
            Atendimento atendimento = new Atendimento();
            atendimento.setId(id);
            atendimento.setStatus(status);
            return atendimento;
        }
    }
}
