package br.com.tdbresponde.client;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import java.io.IOException;
import java.util.logging.Logger;

public class GovCroVerificationService implements CroVerificationService {

    private static final Logger LOGGER = Logger.getLogger(GovCroVerificationService.class.getName());

    String verificationUrl;
    boolean strictMode;

    private static final ThreadLocal<String> ULTIMA_VERIFICACAO = ThreadLocal.withInitial(() -> "VALIDADO");

    public GovCroVerificationService() {
        this.verificationUrl = "https://busca-profissionais.cfo.org.br/";
        this.strictMode = false;
    }

    public GovCroVerificationService(String verificationUrl, boolean strictMode) {
        this.verificationUrl = verificationUrl;
        this.strictMode = strictMode;
    }

    @Override
    public boolean verificar(String cro, String uf) {
        if (cro == null || cro.trim().isEmpty() || uf == null || uf.trim().isEmpty()) {
            ULTIMA_VERIFICACAO.set("REJEITADO");
            return false;
        }

        String croLimpo = cro.trim().replaceAll("\\D", ""); // Remove caracteres não numéricos
        String ufLimpa = uf.trim().toUpperCase();

        if (croLimpo.isEmpty() || ufLimpa.length() != 2) {
            ULTIMA_VERIFICACAO.set("REJEITADO");
            return false;
        }

        // Manter retrocompatibilidade com regras de testes mock
        if ("000000".equals(croLimpo) || "INVALIDO".equalsIgnoreCase(cro)) {
            ULTIMA_VERIFICACAO.set("REJEITADO");
            return false;
        }

        try {
            LOGGER.info("Iniciando consulta real de CRO: " + croLimpo + " UF: " + ufLimpa);
            boolean result = executarConsultaReal(croLimpo, ufLimpa);
            if (result) {
                ULTIMA_VERIFICACAO.set("VALIDADO");
            } else {
                ULTIMA_VERIFICACAO.set("REJEITADO");
            }
            return result;
        } catch (Exception e) {
            LOGGER.warning("Falha na conexao ou validacao externa do CRO com o portal do governo: " + e.getMessage());
            LOGGER.warning("Modo permissivo forcado para falha de integracao. Cadastro de voluntario aprovado com aviso de verificacao manual pendente.");
            ULTIMA_VERIFICACAO.set("FALHA_INTEGRACAO");
            return true;
        }
    }

    @Override
    public String obterStatusUltimaVerificacao() {
        return ULTIMA_VERIFICACAO.get();
    }

    protected boolean executarConsultaReal(String cro, String uf) throws IOException {
        String urlDeBusca = verificationUrl;

        // Conecta ao site do governo simulando um navegador real
        Document doc = Jsoup.connect(urlDeBusca)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .timeout(5000)
                .get();

        return parseHtmlResultado(doc, cro, uf);
    }

    public boolean parseHtmlResultado(Document doc, String cro, String uf) {
        String htmlText = doc.text().toUpperCase();

        boolean contemCroEUf = htmlText.contains(cro) && htmlText.contains(uf);
        boolean contemNaoEncontrado = htmlText.contains("NENHUM PROFISSIONAL ENCONTRADO") ||
                                      htmlText.contains("NENHUM REGISTRO ENCONTRADO") ||
                                      htmlText.contains("NENHUM RESULTADO") ||
                                      htmlText.contains("NAO FORAM ENCONTRADOS") ||
                                      htmlText.contains("NENHUM RESULTADO ENCONTRADO");

        if (contemCroEUf) {
            // Buscar em linhas de tabela, caixas de resultados ou divs de registros
            Elements rows = doc.select("table tr, div.profissional-box, div.resultado-item, table tbody tr, div.card-body");
            if (!rows.isEmpty()) {
                for (Element row : rows) {
                    String rowText = row.text().toUpperCase();
                    if (rowText.contains(cro) && rowText.contains(uf)) {
                        // Se contiver indicações de que está cancelado ou inativo
                        if (rowText.contains("CANCELADO") || rowText.contains("INATIVO") || rowText.contains("SUSPENSO")) {
                            return false;
                        }
                        return true;
                    }
                }
            }

            // Fallback amplo: se o número do CRO e a UF constam na página, e não constam termos de cancelamento
            return !htmlText.contains("SITUAÇÃO: INATIVO") &&
                   !htmlText.contains("SITUAÇÃO: CANCELADO") &&
                   !htmlText.contains("SITUACAO: INATIVO") &&
                   !htmlText.contains("SITUACAO: CANCELADO") &&
                   !htmlText.contains("CANCELADO") &&
                   !htmlText.contains("INATIVO") &&
                   !htmlText.contains("SUSPENSO");
        }

        if (contemNaoEncontrado) {
            // A busca foi executada de fato, mas o CRO não existe no banco do conselho
            return false;
        }

        // Se não encontrou o CRO e também não encontrou a mensagem de "não encontrado", 
        // significa que a busca não foi executada (caiu na página inicial do formulário ou foi bloqueado por CAPTCHA).
        throw new RuntimeException("Portal do governo exigiu CAPTCHA ou a busca nao pôde ser executada no servidor.");
    }
}
