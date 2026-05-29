package br.com.tdbresponde.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ResumoSemanalDTO {

    private Long voluntario_id;
    private Map<String, Map<String, Integer>> resumo;

    public Long getVoluntario_id() {
        return voluntario_id;
    }

    public void setVoluntario_id(Long voluntario_id) {
        this.voluntario_id = voluntario_id;
    }

    public Map<String, Map<String, Integer>> getResumo() {
        return resumo;
    }

    public void setResumo(Map<String, Map<String, Integer>> resumo) {
        this.resumo = resumo;
    }
}
