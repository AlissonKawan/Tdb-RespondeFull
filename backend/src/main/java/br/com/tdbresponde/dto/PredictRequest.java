package br.com.tdbresponde.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Classe que representa o "pacote" de dados enviado para o Python.
 */
public class PredictRequest {
    // Texto da mensagem que o usuário enviou
    public String conteudo;

    // Mapeia o campo Java para o nome "enviado_por" esperado pelo Python
    @JsonProperty("enviado_por")
    public String enviadoPor;

    // Canal de comunicação (ex: whatsapp, email)
    public String canal;

    // Prioridade do atendimento (convertida para o JSON do Python)
    @JsonProperty("prioridade_atendimento")
    public int prioridadeAtendimento;

    // Status atual (ex: ABERTO, EM_ATENDIMENTO)
    @JsonProperty("status_atendimento")
    public String statusAtendimento;

    // Tipo da pessoa (CRIANCA_ADOLESCENTE ou MULHER_APOLONIA)
    @JsonProperty("tipo_pessoa")
    public String tipoPessoa;

    // Nível de gravidade (1 a 5)
    public int gravidade;

    // Construtor vazio padrão (necessário para bibliotecas JSON)
    public PredictRequest() {}

    // Construtor completo para facilitar a criação do objeto no código
    public PredictRequest(String conteudo, String enviadoPor, String canal, int prioridadeAtendimento, String statusAtendimento, String tipoPessoa, int gravidade) {
        this.conteudo = conteudo;
        this.enviadoPor = enviadoPor;
        this.canal = canal;
        this.prioridadeAtendimento = prioridadeAtendimento;
        this.statusAtendimento = statusAtendimento;
        this.tipoPessoa = tipoPessoa;
        this.gravidade = gravidade;
    }
}
