package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.*;
import br.com.tdbresponde.dao.PessoaAtendidaDAO;
import br.com.tdbresponde.dto.*;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.exception.ForbiddenExceptionMapper;
import br.com.tdbresponde.model.*;
import br.com.tdbresponde.security.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AtendimentoAuthorizationTest {
    AtendimentoBO bo;
    MensagemBO mensagens;
    ContaUsuarioBO contas;
    AtendimentoResource resource;
    AtendimentoAccess access;

    @BeforeEach void setup() {
        bo = mock(AtendimentoBO.class); mensagens = mock(MensagemBO.class); contas = mock(ContaUsuarioBO.class);
        access = new AtendimentoAccess(bo, contas, mock(PessoaAtendidaDAO.class));
        resource = new AtendimentoResource(); resource.bo = bo; resource.mensagemBO = mensagens;
        resource.access = access; resource.media = mock(ChatMediaAccess.class);
        resource.identity = new TestIdentity(7, "BENEFICIARIO");
        when(bo.buscarPorId(1)).thenReturn(atendimento(1, 7, 80));
        when(bo.buscarPorId(2)).thenReturn(atendimento(2, 70, 800));
        when(bo.buscarParaAutorizacao(1)).thenReturn(atendimento(1, 7, 80));
        when(bo.buscarParaAutorizacao(2)).thenReturn(atendimento(2, 70, 800));
        when(contas.buscarVoluntarioIdDaConta(8)).thenReturn(80);
    }

    @Test void beneficiarioNaoConsultaCasoOuMensagensDeOutraConta() {
        assertThrows(ForbiddenException.class, () -> resource.buscarPorId(2));
        assertThrows(ForbiddenException.class, () -> resource.listarMensagens(2));
        assertThrows(ForbiddenException.class, () -> resource.listarMensagens(2, 50, 81));
        assertThrows(ForbiddenException.class, () -> resource.inserirMensagem(2, new MensagemRequest()));
        verifyNoInteractions(mensagens);
    }

    @Test void relatoDeOutraContaERejeitadoAntesDePersistir() {
        var relato = new RelatarSituacaoRequest(); relato.idContaBeneficiario = 70;
        assertThrows(ForbiddenException.class, () -> resource.relatar(relato));
        verify(bo, never()).relatar(any());
    }

    @Test void relatoSemIdDeContaEGravadoComContaAutenticada() {
        var relato = new RelatarSituacaoRequest();
        resource.relatar(relato);
        verify(bo).relatar(argThat(r -> r.idContaBeneficiario == 7));
    }

    @Test void envioDeMensagemIgnoraPerfilForjadoNoPayload() {
        var request = new MensagemRequest(); request.enviadoPor = "ADMIN";
        var mensagem = new Mensagem(); mensagem.setAtendimento(atendimento(1, 7, 80));
        when(mensagens.inserir(any(), any(Atendimento.class))).thenReturn(mensagem);
        assertEquals(201, resource.inserirMensagem(1, request).getStatus());
        verify(mensagens).inserir(argThat(r -> r.atendimentoId == 1 && "BENEFICIARIO".equals(r.enviadoPor)),
                argThat(a -> a.getId() == 1));
    }

    @Test void voluntarioNaoAlteraCasoDeOutroVoluntarioPorNenhumaRota() {
        resource.identity = new TestIdentity(8, "VOLUNTARIO");
        assertThrows(ForbiddenException.class, () -> resource.atualizar(2, new AtendimentoRequest()));
        assertThrows(ForbiddenException.class, () -> resource.atualizarStatusPrioridade(2, new AtendimentoAtualizacaoRequest()));
        assertThrows(ForbiddenException.class, () -> resource.atualizarCheckin(2, new CheckinRequest()));
        assertThrows(ForbiddenException.class, () -> resource.encerrar(2, new EncerrarAtendimentoRequest()));
        assertThrows(ForbiddenException.class, () -> resource.assumir(2, new AssumirAtendimentoRequest()));
        assertThrows(ForbiddenException.class, () -> resource.excluir(2));
        verify(bo, never()).atualizar(anyInt(), any());
        verify(bo, never()).atualizarStatusPrioridade(anyInt(), any());
        verify(bo, never()).atualizarCheckin(anyInt(), any());
        verify(bo, never()).encerrar(anyInt(), anyInt());
        verify(bo, never()).assumir(anyInt(), any());
        verify(bo, never()).excluir(anyInt());
    }

    @Test void filaNaoIncluiCasoJaAtribuidoMesmoSeStatusForAberto() {
        resource.identity = new TestIdentity(8, "VOLUNTARIO");
        var fila = atendimento(3, 70, 800); fila.setVoluntario(null); fila.setStatus("ABERTO");
        var alheio = atendimento(2, 70, 800); alheio.setStatus("ABERTO");
        when(bo.listarSolicitados()).thenReturn(List.of(fila, alheio));
        List<?> resultado = (List<?>) resource.listarSolicitados().getEntity();
        assertEquals(1, resultado.size());
        assertEquals(3, ((AtendimentoResponse) resultado.get(0)).id);
    }

    @Test void listagensNaoAceitamParametrosDeOutraContaOuVoluntario() {
        assertThrows(ForbiddenException.class, () -> resource.listarPorContaBeneficiario(70));
        verify(bo, never()).listarPorContaBeneficiario(anyInt());
        resource.identity = new TestIdentity(8, "VOLUNTARIO");
        assertThrows(ForbiddenException.class, () -> resource.listarPorVoluntario(800));
        verify(bo, never()).listarPorVoluntario(anyInt());
    }

    @Test void listagemGeralDoVoluntarioRestringeSQLSemRetirarVerificacaoPorObjeto() {
        resource.identity = new TestIdentity(8, "VOLUNTARIO");
        var proprio = atendimento(1, 7, 80);
        var alheio = atendimento(2, 70, 800);
        var fila = atendimento(3, 70, 800); fila.setVoluntario(null); fila.setStatus("ABERTO");
        when(bo.listarConsultaveisPorVoluntario(80)).thenReturn(List.of(proprio, alheio, fila));
        List<?> resultado = (List<?>) resource.listar().getEntity();
        assertEquals(List.of(1, 3), resultado.stream().map(a -> ((AtendimentoResponse) a).id).toList());
        verify(bo).listarConsultaveisPorVoluntario(80);
        verify(bo, never()).listar();
        verify(contas, times(1)).buscarVoluntarioIdDaConta(8);
    }

    @Test void listagemAdministrativaContinuaCompleta() {
        resource.identity = new TestIdentity(1, "ADMIN");
        when(bo.listar()).thenReturn(List.of(atendimento(2, 70, 800)));
        assertEquals(1, ((List<?>) resource.listar().getEntity()).size());
        verify(bo).listar();
        verify(bo, never()).listarConsultaveisPorVoluntario(any());
    }

    @Test void erroDePermissaoTemStatus403EMensagemSegura() {
        var response = new ForbiddenExceptionMapper().toResponse(new ForbiddenException());
        assertEquals(403, response.getStatus());
        assertEquals(jakarta.ws.rs.core.MediaType.APPLICATION_JSON_TYPE, response.getMediaType());
        assertEquals("no-store", response.getHeaderString("Cache-Control"));
    }

    @Test void beneficiarioRecebeAcompanhamentoSemTriagemInterna() throws Exception {
        var a = atendimento(1, 7, 80);
        var pessoa = new MulherApolonia(); pessoa.setId(10); pessoa.setContaId(7);
        pessoa.setNivelRisco(5); a.setPessoaAtendida(pessoa);
        a.setPrioridade(1); a.setDescricao("Relato sintetico");
        when(bo.buscarPorId(1)).thenReturn(a);
        when(bo.listarPorContaBeneficiario(7)).thenReturn(List.of(a));
        var detalhe = (AtendimentoResponse) resource.buscarPorId(1).getEntity();
        var lista = (List<?>) resource.listarPorContaBeneficiario(7).getEntity();
        for (var dto : List.of(detalhe, (AtendimentoResponse) lista.get(0))) {
            assertNull(dto.prioridade); assertNull(dto.gravidade); assertNull(dto.voluntario);
            assertEquals("Relato sintetico", dto.descricao);
            var json = new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(dto);
            assertFalse(json.has("prioridade")); assertFalse(json.has("gravidade"));
        }
    }

    @Test void filaEDetalheNaoRevelamRelatoIdentidadeOuContatoAntesDaAtribuicao() {
        resource.identity = new TestIdentity(8, "VOLUNTARIO");
        var a = atendimento(3, 70, 800); a.setVoluntario(null); a.setStatus("ABERTO");
        a.setDescricao("Relato sintetico reservado"); a.setPrioridade(2);
        a.getPessoaAtendida().setNomeCodificado("Pessoa sintetica");
        a.getPessoaAtendida().setTelefone("contato sintetico");
        a.getPessoaAtendida().setEmail("fixture@example.invalid");
        when(bo.listarSolicitados()).thenReturn(List.of(a));
        when(bo.listarConsultaveisPorVoluntario(80)).thenReturn(List.of(a));
        when(bo.buscarPorId(3)).thenReturn(a);
        var fila = (List<?>) resource.listarSolicitados().getEntity();
        var geral = (List<?>) resource.listar().getEntity();
        var detalhe = (AtendimentoResponse) resource.buscarPorId(3).getEntity();
        for (var dto : List.of((AtendimentoResponse) fila.get(0), (AtendimentoResponse) geral.get(0), detalhe)) {
            assertEquals(3, dto.id); assertEquals(2, dto.prioridade);
            assertNull(dto.descricao); assertNull(dto.pessoaAtendidaNome);
            assertNull(dto.pessoaAtendidaTelefone); assertNull(dto.pessoaAtendidaEmail);
            assertNull(dto.pessoaAtendidaId); assertNull(dto.beneficiarioId);
        }
    }

    @Test void voluntarioAtribuidoEAdminMantemDetalhesNecessarios() {
        var a = atendimento(1, 7, 80); a.setDescricao("Relato sintetico reservado");
        a.setPrioridade(1); when(bo.buscarPorId(1)).thenReturn(a);
        resource.identity = new TestIdentity(8, "VOLUNTARIO");
        assertEquals(a.getDescricao(), ((AtendimentoResponse) resource.buscarPorId(1).getEntity()).descricao);
        resource.identity = new TestIdentity(1, "ADMIN");
        assertEquals(1, ((AtendimentoResponse) resource.buscarPorId(1).getEntity()).prioridade);
    }

    static Atendimento atendimento(int id, int conta, int voluntario) {
        var a = new Atendimento(); a.setId(id); a.setStatus("EM_ATENDIMENTO");
        var p = new PessoaAtendidaBase(); p.setId(10); p.setContaId(conta); a.setPessoaAtendida(p);
        var v = new Voluntario(); v.setId(voluntario); a.setVoluntario(v);
        return a;
    }
}
