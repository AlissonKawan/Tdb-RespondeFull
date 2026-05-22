package br.com.tdbresponde.config;

import br.com.tdbresponde.dto.CheckinPrevisaoResponse;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.MulherApolonia;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Cliente HTTP para consumir a API Python de Inteligência Artificial.
 * Chama o endpoint /predict_checkin e retorna a previsão de comparecimento.
 */
@ApplicationScoped
public class IaClient {

    @ConfigProperty(name = "ia.api.url", defaultValue = "http://localhost:5000")
    String iaApiUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    /**
     * Consulta a IA para prever o resultado do check-in de um atendimento.
     * Em caso de erro de conexão ou timeout, retorna null sem lançar exceção,
     * garantindo que o sistema principal continue funcionando mesmo sem a IA.
     */
    public CheckinPrevisaoResponse preverCheckin(Atendimento atendimento) {
        try {
            String tipoPessoa = resolverTipoPessoa(atendimento);
            String canal = resolverCanal(atendimento);
            int gravidade = resolverGravidade(atendimento);
            int risco = resolverRisco(atendimento);
            int prioridade = atendimento.getPrioridade() > 0 ? atendimento.getPrioridade() : 3;
            String statusAtendimento = atendimento.getStatus() != null ? atendimento.getStatus() : "ABERTO";

            String body = String.format(
                "{\"tipo_pessoa\":\"%s\",\"canal\":\"%s\",\"gravidade\":%d,\"risco\":%d,\"prioridade\":%d,\"status_atendimento\":\"%s\"}",
                tipoPessoa, canal, gravidade, risco, prioridade, statusAtendimento
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(iaApiUrl + "/predict_checkin"))
                    .timeout(Duration.ofSeconds(3))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return parsearResposta(response.body());
            }

        } catch (Exception e) {
            // IA offline ou indisponível — falha silenciosa para não impactar o sistema principal
            System.out.println("[IaClient] IA indisponivel: " + e.toString());
        }

        return null;
    }

    /** Extrai o tipo de pessoa a partir do objeto Atendimento. */
    private String resolverTipoPessoa(Atendimento atendimento) {
        if (atendimento.getPessoaAtendida() instanceof MulherApolonia) return "MULHER_APOLONIA";
        if (atendimento.getPessoaAtendida() instanceof CriancaAdolescente) return "CRIANCA_ADOLESCENTE";
        return "OUTRO";
    }

    /** Normaliza o nome do canal para o formato aceito pela API Python. */
    private String resolverCanal(Atendimento atendimento) {
        if (atendimento.getCanalOrigem() == null || atendimento.getCanalOrigem().getNome() == null) {
            return "sistema_web";
        }
        String nome = atendimento.getCanalOrigem().getNome().toLowerCase();
        if (nome.contains("whatsapp")) return "whatsapp";
        if (nome.contains("email"))    return "email";
        if (nome.contains("presencial")) return "presencial";
        return "sistema_web";
    }

    /** Retorna a gravidade bucal se for criança/adolescente, 0 caso contrário. */
    private int resolverGravidade(Atendimento atendimento) {
        if (atendimento.getPessoaAtendida() instanceof CriancaAdolescente ca) {
            return ca.getGravidadeBucal();
        }
        return 0;
    }

    /** Retorna o nível de risco se for mulher Apolônia, 0 caso contrário. */
    private int resolverRisco(Atendimento atendimento) {
        if (atendimento.getPessoaAtendida() instanceof MulherApolonia ma) {
            return ma.getNivelRisco();
        }
        return 0;
    }

    @Inject
    com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Faz parsing da resposta JSON usando o ObjectMapper do Quarkus (Jackson).
     * Exemplo de resposta: {"previsao_checkin":"CONFIRMADO","confianca":0.66,...}
     */
    private CheckinPrevisaoResponse parsearResposta(String json) {
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(json);
            String previsao = root.has("previsao_checkin") ? root.get("previsao_checkin").asText() : null;
            double confianca = root.has("confianca") ? root.get("confianca").asDouble() : 0.0;
            return new CheckinPrevisaoResponse(previsao, confianca);
        } catch (Exception e) {
            System.out.println("[IaClient] Erro ao fazer parse da resposta JSON: " + e.getMessage());
            return null;
        }
    }
}
