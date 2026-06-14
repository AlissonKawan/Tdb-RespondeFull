package br.com.tdbresponde.config;

import br.com.tdbresponde.dto.CheckinPrevisaoResponse;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.Mensagem;
import br.com.tdbresponde.dao.MensagemDAO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Cliente HTTP para consumir a API do Google Gemini.
 * Envia o histórico real de mensagens para o LLM classificar a probabilidade de comparecimento.
 */
@ApplicationScoped
public class IaClient {

    @ConfigProperty(name = "gemini.api.key", defaultValue = "SUA_CHAVE_GEMINI_AQUI")
    String geminiApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @Inject
    MensagemDAO mensagemDAO;

    @Inject
    com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Consulta o Gemini para interpretar o histórico de chat e prever o check-in.
     */
    public CheckinPrevisaoResponse preverCheckin(Atendimento atendimento) {
        try {
            // 1. Puxar as mensagens do atendimento
            List<Mensagem> mensagens = mensagemDAO.buscarPorAtendimento(atendimento.getId());
            if (mensagens == null || mensagens.isEmpty()) {
                System.out.println("[IaClient] Nenhuma mensagem encontrada para o atendimento " + atendimento.getId());
                return null;
            }

            // 2. Montar histórico de texto
            String historico = mensagens.stream()
                .map(m -> "[" + m.getEnviadoPor() + "]: " + m.getConteudo())
                .collect(Collectors.joining("\n"));

            // 3. Montar o Prompt inteligente
            String prompt = "Você é um assistente da ONG Turma do Bem. Sua função é ler a conversa abaixo e descobrir se o paciente confirmou presença na consulta (check-in).\n\n" +
                            "Responda EXCLUSIVAMENTE com um JSON válido neste exato formato:\n" +
                            "{\"previsao_checkin\": \"CONFIRMADO\" | \"NAO_COMPARECERA\" | \"REAGENDAMENTO_SOLICITADO\" | \"SEM_RESPOSTA\", \"confianca\": 0.95}\n\n" +
                            "Regras:\n" +
                            "- Se o beneficiário confirmou ou disse 'sim', retorne CONFIRMADO.\n" +
                            "- Se ele disse que não pode ir ou vai faltar, retorne NAO_COMPARECERA.\n" +
                            "- Se ele pediu para mudar dia/horário, retorne REAGENDAMENTO_SOLICITADO.\n" +
                            "- Se não houve resposta clara, retorne SEM_RESPOSTA.\n\n" +
                            "Histórico de mensagens:\n" + historico;

            // 4. Estruturar o JSON pro Gemini
            com.fasterxml.jackson.databind.node.ObjectNode rootNode = objectMapper.createObjectNode();
            com.fasterxml.jackson.databind.node.ArrayNode contentsArray = rootNode.putArray("contents");
            com.fasterxml.jackson.databind.node.ObjectNode contentItem = contentsArray.addObject();
            com.fasterxml.jackson.databind.node.ArrayNode partsArray = contentItem.putArray("parts");
            partsArray.addObject().put("text", prompt);
            
            com.fasterxml.jackson.databind.node.ObjectNode configNode = rootNode.putObject("generationConfig");
            configNode.put("responseMimeType", "application/json");

            String body = objectMapper.writeValueAsString(rootNode);

            String urlComChave = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

            // 5. Enviar request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(urlComChave))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return parsearRespostaGemini(response.body());
            } else {
                System.out.println("[IaClient] Erro da API Gemini: " + response.statusCode() + " - " + response.body());
            }

        } catch (Exception e) {
            System.out.println("[IaClient] IA indisponivel ou falha na integração: " + e.toString());
        }

        return null;
    }

    /**
     * Faz parsing da resposta do Gemini que já devolve JSON puro no texto.
     */
    private CheckinPrevisaoResponse parsearRespostaGemini(String json) {
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(json);
            if (root.has("candidates") && root.get("candidates").isArray() && root.get("candidates").size() > 0) {
                String text = root.get("candidates").get(0)
                        .get("content").get("parts").get(0)
                        .get("text").asText();
                
                // O Gemini devolveu o JSON interno conforme solicitado
                com.fasterxml.jackson.databind.JsonNode innerRoot = objectMapper.readTree(text);
                String previsao = innerRoot.has("previsao_checkin") ? innerRoot.get("previsao_checkin").asText() : "SEM_RESPOSTA";
                double confianca = innerRoot.has("confianca") ? innerRoot.get("confianca").asDouble() : 0.0;
                
                System.out.println("[IaClient] Gemini concluiu! Status: " + previsao + " | Confiança: " + confianca);
                return new CheckinPrevisaoResponse(previsao, confianca);
            }
        } catch (Exception e) {
            System.out.println("[IaClient] Erro ao parsear resposta do Gemini: " + e.getMessage());
        }
        return null;
    }
}
