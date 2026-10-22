package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.*;
import br.com.tdbresponde.dao.PessoaAtendidaDAO;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.model.Mensagem;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.security.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MensagemResourceTest {
    MensagemResource resource;
    MensagemBO bo;
    ChatMediaAccess media;
    @TempDir Path dir;

    @BeforeEach void setup() {
        var atendimentos = mock(AtendimentoBO.class);
        when(atendimentos.buscarPorId(1)).thenReturn(AtendimentoAuthorizationTest.atendimento(1, 7, 80));
        when(atendimentos.buscarPorId(2)).thenReturn(AtendimentoAuthorizationTest.atendimento(2, 70, 800));
        when(atendimentos.buscarParaAutorizacao(1)).thenReturn(AtendimentoAuthorizationTest.atendimento(1, 7, 80));
        when(atendimentos.buscarParaAutorizacao(2)).thenReturn(AtendimentoAuthorizationTest.atendimento(2, 70, 800));
        resource = new MensagemResource();
        resource.bo = bo = mock(MensagemBO.class);
        resource.media = media = mock(ChatMediaAccess.class);
        resource.access = new AtendimentoAccess(atendimentos, mock(ContaUsuarioBO.class), mock(PessoaAtendidaDAO.class));
        resource.identity = new TestIdentity(7, "BENEFICIARIO");
    }

    @Test void endpointsAlternativosDeMensagemTambemNegamAcessoCruzado() {
        var mensagem = new Mensagem(); mensagem.setAtendimento(AtendimentoAuthorizationTest.atendimento(2, 70, 800));
        when(bo.buscarPorId(50)).thenReturn(mensagem);
        assertThrows(ForbiddenException.class, () -> resource.buscarPorId(50));
        assertThrows(ForbiddenException.class, () -> resource.listarPorAtendimento(2));
        var request = new MensagemRequest(); request.atendimentoId = 2;
        assertThrows(ForbiddenException.class, () -> resource.inserir(request));
        verify(bo, never()).inserir(any());
        verify(bo, never()).inserir(any(), any(Atendimento.class));
        verify(bo, never()).listarPorAtendimento(anyInt());
        verify(bo, never()).listarPorAtendimento(any(Atendimento.class));
    }

    @Test void endpointAlternativoTambemDerivaRemetenteDaSessao() {
        var request = new MensagemRequest(); request.atendimentoId = 1; request.enviadoPor = "ADMIN";
        when(bo.inserir(any(), any(Atendimento.class))).thenReturn(new Mensagem());
        assertEquals(201, resource.inserir(request).getStatus());
        verify(bo).inserir(argThat(r -> "BENEFICIARIO".equals(r.enviadoPor)), argThat(a -> a.getId() == 1));
    }

    @Test void uploadRejeitaCasoAlheioAntesDeGravarArquivo() {
        assertThrows(ForbiddenException.class, () -> resource.upload(mock(FileUpload.class), 2));
        assertThrows(BusinessException.class, () -> resource.upload(mock(FileUpload.class), null));
        verifyNoInteractions(media);
    }

    @Test void uploadVinculaNomeAoAtendimentoEConservaContratoDeResposta() throws Exception {
        Path origem = Files.write(dir.resolve("origem.png"), new byte[]{1, 2});
        FileUpload upload = mock(FileUpload.class);
        when(upload.fileName()).thenReturn("foto.png"); when(upload.contentType()).thenReturn("image/png");
        when(upload.uploadedFile()).thenReturn(origem);
        when(media.arquivo(anyString())).thenAnswer(call -> dir.resolve(call.getArgument(0, String.class)));
        var response = resource.upload(upload, 1);
        assertEquals(201, response.getStatus());
        var payload = (java.util.Map<?, ?>) response.getEntity();
        String url = (String) payload.get("arquivoUrl");
        assertTrue(url.startsWith("/mensagens/midia/1-"));
        assertEquals("image/png", payload.get("mimeType"));
        assertArrayEquals(new byte[]{1, 2}, Files.readAllBytes(dir.resolve(url.substring(url.lastIndexOf('/') + 1))));
    }

    @Test void downloadNaoRetornaStreamAntesDaAutorizacao() throws Exception {
        Path file = Files.write(dir.resolve("foto.png"), new byte[]{1});
        when(media.arquivo("foto.png")).thenReturn(file);
        doThrow(new ForbiddenException()).when(media).autorizarLeitura("foto.png", resource.identity);
        assertThrows(ForbiddenException.class, () -> resource.buscarMidia("foto.png"));
    }

    @Test void downloadAutorizadoNaoMantemCacheEntreSessoes() throws Exception {
        when(media.arquivo("foto.png")).thenReturn(Files.write(dir.resolve("foto.png"), new byte[]{1}));
        var response = resource.buscarMidia("foto.png");
        assertEquals(200, response.getStatus());
        assertEquals("no-store", response.getHeaderString("Cache-Control"));
        verify(media).autorizarLeitura("foto.png", resource.identity);
    }
}
