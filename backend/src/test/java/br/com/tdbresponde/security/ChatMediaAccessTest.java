package br.com.tdbresponde.security;

import br.com.tdbresponde.dao.MensagemDAO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatMediaAccessTest {
    @TempDir Path dir;
    ChatMediaAccess media;
    AtendimentoAccess access;
    MensagemDAO dao;
    TestIdentity identity = new TestIdentity(7, "BENEFICIARIO");
    String uuid = "12345678-1234-1234-1234-123456789abc.png";

    @BeforeEach void setup() {
        media = new ChatMediaAccess(); media.diretorio = dir;
        media.access = access = mock(AtendimentoAccess.class);
        media.mensagens = dao = mock(MensagemDAO.class);
    }

    @Test void novaMidiaExigeAcessoAoAtendimentoDoNome() {
        media.autorizarLeitura("1-" + uuid, identity);
        verify(access).conversar(1, identity);
        verifyNoInteractions(dao);
        doThrow(new ForbiddenException()).when(access).conversar(2, identity);
        assertThrows(ForbiddenException.class, () -> media.autorizarLeitura("2-" + uuid, identity));
    }

    @Test void midiaLegadaUsaVinculoDoBancoENaoSomenteConhecimentoDaUrl() {
        when(dao.buscarAtendimentosPorArquivoUrl("/mensagens/midia/" + uuid)).thenReturn(List.of(1));
        media.autorizarLeitura(uuid, identity);
        verify(access).conversar(1, identity);
        doThrow(new ForbiddenException()).when(access).conversar(1, identity);
        assertThrows(ForbiddenException.class, () -> media.autorizarLeitura(uuid, identity));
    }

    @Test void midiaLegadaSemMensagemNaoFicaDisponivelParaQualquerConta() {
        assertThrows(ForbiddenException.class, () -> media.autorizarLeitura(uuid, identity));
    }

    @Test void anexoNaoPodeSerTransferidoParaOutroAtendimento() throws Exception {
        Files.write(dir.resolve("2-" + uuid), new byte[]{1});
        assertThrows(ForbiddenException.class,
                () -> media.validarVinculo("/mensagens/midia/2-" + uuid, 1, identity));
    }

    @Test void anexoNovoAceitaVinculoCorretoENaoAceitaArquivoInexistente() throws Exception {
        String url = "/mensagens/midia/1-" + uuid;
        assertThrows(NotFoundException.class, () -> media.validarVinculo(url, 1, identity));
        Files.write(dir.resolve("1-" + uuid), new byte[]{1});
        media.validarVinculo(url, 1, identity);
    }

    @Test void anexoLegadoExigeMesmoAtendimento() throws Exception {
        Files.write(dir.resolve(uuid), new byte[]{1});
        String url = "/mensagens/midia/" + uuid;
        when(dao.buscarAtendimentosPorArquivoUrl(url)).thenReturn(List.of(2));
        assertThrows(ForbiddenException.class, () -> media.validarVinculo(url, 1, identity));
        when(dao.buscarAtendimentosPorArquivoUrl(url)).thenReturn(List.of(1));
        media.validarVinculo(url, 1, identity);
    }

    @Test void rejeitaUrlsExternasTraversalENomesInvalidos() {
        assertThrows(BusinessException.class,
                () -> media.validarVinculo("https://example.test/foto.png", 1, identity));
        for (String nome : new String[]{"../foto.png", "1-../foto.png", "foto.png", "9999999999-" + uuid}) {
            assertThrows(NotFoundException.class, () -> media.autorizarLeitura(nome, identity));
        }
        verifyNoInteractions(dao);
    }
}
