package br.com.tdbresponde.model;

import java.time.LocalDateTime;

public class Prontuario {
    private int id;
    private int voluntarioId;
    private int agendaId;
    private String paciente;
    private String historicoMedico;
    private String tratamentoAtual;
    private LocalDateTime dataRegistro;

    public Prontuario() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getVoluntarioId() { return voluntarioId; }
    public void setVoluntarioId(int voluntarioId) { this.voluntarioId = voluntarioId; }

    public int getAgendaId() { return agendaId; }
    public void setAgendaId(int agendaId) { this.agendaId = agendaId; }

    public String getPaciente() { return paciente; }
    public void setPaciente(String paciente) { this.paciente = paciente; }

    public String getHistoricoMedico() { return historicoMedico; }
    public void setHistoricoMedico(String historicoMedico) { this.historicoMedico = historicoMedico; }

    public String getTratamentoAtual() { return tratamentoAtual; }
    public void setTratamentoAtual(String tratamentoAtual) { this.tratamentoAtual = tratamentoAtual; }

    public LocalDateTime getDataRegistro() { return dataRegistro; }
    public void setDataRegistro(LocalDateTime dataRegistro) { this.dataRegistro = dataRegistro; }
}
