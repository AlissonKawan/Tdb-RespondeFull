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
        when(contas.buscarVoluntarioIdDaConta(8)).thenReturn(80);
    }

    @Test void beneficiarioNaoConsultaCasoMensagensOuPrevisaoDeOutraConta() {
        assertThrows(ForbiddenException.class, () -> resource.buscarPorId(2));
        assertThrows(ForbiddenException.class, () -> resource.listarMensagens(2));
        assertThrows(ForbiddenException.class, () -> resource.buscarPrevisaoIA(2));
        assertThrows(ForbiddenException.class, () -> resource.inserirMensagem(2, new MensagemRequest()));
        verifyNoInteractions(mensagens);
        verify(bo, never()).preverCheckinIA(anyInt());
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
        when(mensagens.inserir(any())).thenReturn(mensagem);
        assertEquals(201, resource.inserirMensagem(1, request).getStatus());
        verify(mensagens).inserir(argThat(r -> r.atendimentoId == 1 && "BENEFICIARIO".equals(r.enviadoPor)));
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
        verify(bo, never()).atualizarCheckinComPrevisao(anyInt(), any(), any());
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

    @Test void erroDePermissaoTemStatus403EMensagemSegura() {
        var response = new ForbiddenExceptionMapper().toResponse(new ForbiddenException());
        assertEquals(403, response.getStatus());
        assertEquals(jakarta.ws.rs.core.MediaType.APPLICATION_JSON_TYPE, response.getMediaType());
        assertEquals("no-store", response.getHeaderString("Cache-Control"));
    }

    static Atendimento atendimento(int id, int conta, int voluntario) {
        var a = new Atendimento(); a.setId(id); a.setStatus("EM_ATENDIMENTO");
        var p = new PessoaAtendidaBase(); p.setId(10); p.setContaId(conta); a.setPessoaAtendida(p);
        var v = new Voluntario(); v.setId(voluntario); a.setVoluntario(v);
        return a;
    }
}
