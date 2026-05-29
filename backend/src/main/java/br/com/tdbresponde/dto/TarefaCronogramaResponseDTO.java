package br.com.tdbresponde.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TarefaCronogramaResponseDTO {

    private Long voluntario_id;
    private Integer total;
    private List<TarefaCronogramaDTO> tarefas;

    public Long getVoluntario_id() {
        return voluntario_id;
    }

    public void setVoluntario_id(Long voluntario_id) {
        this.voluntario_id = voluntario_id;
    }

    public Integer getTotal() {
        return total;
    }

    public void setTotal(Integer total) {
        this.total = total;
    }

    public List<TarefaCronogramaDTO> getTarefas() {
        return tarefas;
    }

    public void setTarefas(List<TarefaCronogramaDTO> tarefas) {
        this.tarefas = tarefas;
    }
}
