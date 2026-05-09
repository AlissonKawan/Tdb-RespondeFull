package model;

import java.time.LocalDateTime;

public class HistoricoStatus {

    private int id;
    private Atendimento atendimento;
    private String statusAnterior;
    private String statusNovo;
    private Voluntario alteradoPor;
    private LocalDateTime dataHora;

    // Construtor vazio (necessário para DAO)
    public HistoricoStatus() {
    }

    // Construtor completo


    public HistoricoStatus(Voluntario alteradoPor, Atendimento atendimento, LocalDateTime dataHora, int id, String statusAnterior, String statusNovo) {
        this.id = id;
        this.atendimento = atendimento;
        this.statusAnterior = statusAnterior;
        this.statusNovo = statusNovo;
        this. alteradoPor = alteradoPor;
        this. dataHora = dataHora;
    }

    // Getters e Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Atendimento getAtendimento() {
        return atendimento;
    }

    public void setAtendimento(Atendimento atendimento) {
        this.atendimento = atendimento;
    }

    public String getStatusAnterior() {
        return statusAnterior;
    }

    public void setStatusAnterior(String statusAnterior) {
        this.statusAnterior = statusAnterior;
    }

    public String getStatusNovo() {
        return statusNovo;
    }

    public void setStatusNovo(String statusNovo) {
        this.statusNovo = statusNovo;
    }

    public Voluntario getAlteradoPor() {
        return alteradoPor;
    }

    public void setAlteradoPor(Voluntario alteradoPor) {
        this.alteradoPor = alteradoPor;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    // toString conforme pedido
    @Override
    public String toString() {
        return "Atendimento ID: " + atendimento.getId() +
                " | " + statusAnterior + " → " + statusNovo +
                " | Alterado por: " + alteradoPor.getNome() +
                " | Data/Hora: " + dataHora;
    }
}
