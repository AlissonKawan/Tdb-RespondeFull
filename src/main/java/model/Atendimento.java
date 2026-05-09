package model;

import java.time.LocalDate;

public class Atendimento {
    private int id;
    private PessoaAtendida pessoaAtendida; // pode ser criancaAdolescente ou MulherApolonia;
    private Voluntario voluntario;
    private int prioridade; //1=crítico, 2=alto, 3=médio, 4=baixo
    private String status; //"Aberto", "Em andamento", "Encerrado"
    private CanalComunicacao canalOrigem;
    private LocalDate dataAbertura;
    private LocalDate dataEncerramento; // pode ser null se não encerrou

    public Atendimento() {}

    public Atendimento(CanalComunicacao canalOrigem, LocalDate dataEncerramento, LocalDate dataAbertura, int id, PessoaAtendida pessoaAtendida, int prioridade, String status, Voluntario voluntario) {
        this.canalOrigem = canalOrigem;
        this.dataEncerramento = dataEncerramento;
        this.dataAbertura = dataAbertura;
        this.id = id;
        this.pessoaAtendida = pessoaAtendida;
        this.prioridade = prioridade;
        this.status = status;
        this.voluntario = voluntario;
    }

    public CanalComunicacao getCanalOrigem() {
        return canalOrigem;
    }

    public void setCanalOrigem(CanalComunicacao canalOrigem) {
        this.canalOrigem = canalOrigem;
    }

    public LocalDate getDataAbertura() {
        return dataAbertura;
    }

    public void setDataAbertura(LocalDate dataAbertura) {
        this.dataAbertura = dataAbertura;
    }

    public LocalDate getDataEncerramento() {
        return dataEncerramento;
    }

    public void setDataEncerramento(LocalDate dataEncerramento) {
        this.dataEncerramento = dataEncerramento;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public PessoaAtendida getPessoaAtendida() {
        return pessoaAtendida;
    }

    public void setPessoaAtendida(PessoaAtendida pessoaAtendida) {
        this.pessoaAtendida = pessoaAtendida;
    }

    public int getPrioridade() {
        return prioridade;
    }

    public void setPrioridade(int prioridade) {
        this.prioridade = prioridade;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Voluntario getVoluntario() {
        return voluntario;
    }

    public void setVoluntario(Voluntario voluntario) {
        this.voluntario = voluntario;
    }

    @Override
    public String toString() {
        return "Atendimento{" +
                "id=" + id +
                ", pessoaAtendida=" + pessoaAtendida +
                ", voluntario=" + voluntario +
                ", prioridade=" + prioridade +
                ", status='" + status + '\'' +
                '}';
    }
}
