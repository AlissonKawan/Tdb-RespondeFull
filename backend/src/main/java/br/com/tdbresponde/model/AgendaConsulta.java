package br.com.tdbresponde.model;

import java.time.LocalDate;

public class AgendaConsulta {
    private int id;
    private int voluntarioId;
    private String paciente;
    private String tipo;
    private LocalDate dataConsulta;
    private String horario;
    private String status;
    private String tipoPessoa;

    public AgendaConsulta() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getVoluntarioId() { return voluntarioId; }
    public void setVoluntarioId(int voluntarioId) { this.voluntarioId = voluntarioId; }

    public String getPaciente() { return paciente; }
    public void setPaciente(String paciente) { this.paciente = paciente; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public LocalDate getDataConsulta() { return dataConsulta; }
    public void setDataConsulta(LocalDate dataConsulta) { this.dataConsulta = dataConsulta; }

    public String getHorario() { return horario; }
    public void setHorario(String horario) { this.horario = horario; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTipoPessoa() { return tipoPessoa; }
    public void setTipoPessoa(String tipoPessoa) { this.tipoPessoa = tipoPessoa; }
}
