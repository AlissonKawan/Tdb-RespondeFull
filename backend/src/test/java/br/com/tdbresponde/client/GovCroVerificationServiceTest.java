package br.com.tdbresponde.client;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

public class GovCroVerificationServiceTest {

    private GovCroVerificationService service;

    @BeforeEach
    void setUp() {
        service = new GovCroVerificationService();
        service.strictMode = false;
        service.verificationUrl = "https://busca-profissionais.cfo.org.br/";
    }

    @Test
    void deveRetornarFalseParaParametrosNulosOuVazios() {
        assertFalse(service.verificar(null, "SP"));
        assertFalse(service.verificar("", "SP"));
        assertFalse(service.verificar("12345", null));
        assertFalse(service.verificar("12345", ""));
        assertFalse(service.verificar("INVALIDO", "SP"));
        assertFalse(service.verificar("000000", "SP"));
    }

    @Test
    void deveRetornarTrueQuandoHtmlContemCroEUfAtivos() {
        String htmlValido = "<html><body>" +
                "<table>" +
                "  <tr>" +
                "    <td>Nome: Joao Dentista</td>" +
                "    <td>CRO: 12345</td>" +
                "    <td>UF: SP</td>" +
                "    <td>Situação: Ativo</td>" +
                "  </tr>" +
                "</table>" +
                "</body></html>";
        Document doc = Jsoup.parse(htmlValido);
        assertTrue(service.parseHtmlResultado(doc, "12345", "SP"));
    }

    @Test
    void deveRetornarFalseQuandoHtmlContemMensagemDeNenhumRegistroEncontrado() {
        String htmlInvalido = "<html><body>" +
                "<div class='resultado'>Nenhum profissional encontrado para os filtros informados</div>" +
                "</body></html>";
        Document doc = Jsoup.parse(htmlInvalido);
        assertFalse(service.parseHtmlResultado(doc, "12345", "SP"));
    }

    @Test
    void deveRetornarFalseQuandoProfissionalEstaCanceladoOuInativo() {
        String htmlCancelado = "<html><body>" +
                "<div>" +
                "  <span>CRO: 55555</span>" +
                "  <span>UF: RJ</span>" +
                "  <span>Situação: Cancelado</span>" +
                "</div>" +
                "</body></html>";
        Document doc = Jsoup.parse(htmlCancelado);
        assertFalse(service.parseHtmlResultado(doc, "55555", "RJ"));

        String htmlInativo = "<html><body>" +
                "<table><tr><td>CRO: 55555</td><td>UF: RJ</td><td>SITUAÇÃO: INATIVO</td></tr></table>" +
                "</body></html>";
        Document docInativo = Jsoup.parse(htmlInativo);
        assertFalse(service.parseHtmlResultado(docInativo, "55555", "RJ"));
    }

    @Test
    void deveRetornarTrueNoModoPermissivoQuandoOcorrerErroDeConexao() {
        GovCroVerificationService serviceComErro = new GovCroVerificationService() {
            @Override
            protected boolean executarConsultaReal(String cro, String uf) throws IOException {
                throw new IOException("Connection timed out");
            }
        };
        serviceComErro.strictMode = false;
        
        assertTrue(serviceComErro.verificar("12345", "SP"),
                "No modo permissivo (strictMode=false), falha de conexão deve retornar true");
    }

    @Test
    void deveRetornarFalseNoModoEstritoQuandoOcorrerErroDeConexao() {
        GovCroVerificationService serviceComErroStrict = new GovCroVerificationService() {
            @Override
            protected boolean executarConsultaReal(String cro, String uf) throws IOException {
                throw new IOException("Connection timed out");
            }
        };
        serviceComErroStrict.strictMode = true;

        assertFalse(serviceComErroStrict.verificar("12345", "SP"),
                "No modo estrito (strictMode=true), falha de conexão deve retornar false");
    }
}
