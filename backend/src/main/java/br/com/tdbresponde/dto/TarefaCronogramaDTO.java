package br.com.tdbresponde.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TarefaCronogramaDTO {

    @JsonProperty("id_tarefa")
    private Long idTarefa;

    @JsonProperty("id_voluntario")
    private Long idVoluntario;

    private String tipo;

    @JsonProperty("dia_semana")
    private String diaSemana;

    private String titulo;

    private String descricao;

    private String status;

    private String prioridade;

    @JsonProperty("data_atividade")
    private String dataAtividade;

    @JsonProperty("hora_inicio")
    private String horaInicio;

    @JsonProperty("hora_fim")
    private String horaFim;

    @JsonProperty("data_criacao")
    private String dataCriacao;

    @JsonProperty("data_atualizacao")
    private String dataAtualizacao;

    // Getters and Setters

    @JsonProperty("id_tarefa")
    public Long getIdTarefa() {
        return idTarefa;
    }

    public void setIdTarefa(Long idTarefa) {
        this.idTarefa = idTarefa;
    }

    @JsonProperty("id_voluntario")
    public Long getIdVoluntario() {
        return idVoluntario;
    }

    // Fallback para a versão da API Python que possa estar esperando voluntario_id
    @JsonProperty("voluntario_id")
    public Long getVoluntarioIdAlternativo() {
        return idVoluntario;
    }

    public void setIdVoluntario(Long idVoluntario) {
        this.idVoluntario = idVoluntario;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    @JsonProperty("dia_semana")
    public String getDiaSemana() {
        return diaSemana;
    }

    public void setDiaSemana(String diaSemana) {
        this.diaSemana = diaSemana;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPrioridade() {
        return prioridade;
    }

    public void setPrioridade(String prioridade) {
        this.prioridade = prioridade;
    }

    @JsonProperty("data_atividade")
    public String getDataAtividade() {
        return dataAtividade;
    }

    public void setDataAtividade(String dataAtividade) {
        this.dataAtividade = dataAtividade;
    }

    @JsonProperty("hora_inicio")
    public String getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(String horaInicio) {
        this.horaInicio = horaInicio;
    }

    @JsonProperty("hora_fim")
    public String getHoraFim() {
        return horaFim;
    }

    public void setHoraFim(String horaFim) {
        this.horaFim = horaFim;
    }

    @JsonProperty("data_criacao")
    public String getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(String dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    @JsonProperty("data_atualizacao")
    public String getDataAtualizacao() {
        return dataAtualizacao;
    }

    public void setDataAtualizacao(String dataAtualizacao) {
        this.dataAtualizacao = dataAtualizacao;
    }
}
