package br.com.tdbresponde.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

/**
 * Classe que recebe o resultado vindo da API Python.
 */
public class PredictResponse {
    // Mapeia "categoria_prevista" do Python para esta variável
    @JsonProperty("categoria_prevista")
    public String categoriaPrevista;

    // Recebe o mapa de probabilidades de todas as categorias
    public Map<String, Double> probabilidades;

    // Recebe o valor de confiança (ex: 0.95)
    public Double confianca;
}
