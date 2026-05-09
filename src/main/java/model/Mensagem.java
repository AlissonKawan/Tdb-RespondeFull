package model;

import java.time.LocalDateTime;

public class Mensagem {

    private int id;
    private Atendimento atendimento; //representa a qual atendimento pertence
    private String conteudo; //texto da mensagem
    private LocalDateTime dataHora; //guardar data e hora
    private String enviadoPor; //Voluntario ou Pessoa atendida
    private CanalComunicacao canal; //por onde foi enviada a mensagem

    public Mensagem() {}

    public Mensagem(CanalComunicacao canal, Atendimento atendimento, String conteudo, LocalDateTime dataHora, String enviadoPor, int id) {
        this.canal = canal;
        this.atendimento = atendimento;
        this.conteudo = conteudo;
        this.dataHora = dataHora;
        this.enviadoPor = enviadoPor;
        this.id = id;
    }

    public Atendimento getAtendimento() {
        return atendimento;
    }

    public void setAtendimento(Atendimento atendimento) {
        this.atendimento = atendimento;
    }

    public CanalComunicacao getCanal() {
        return canal;
    }

    public void setCanal(CanalComunicacao canal) {
        this.canal = canal;
    }

    public String getConteudo() {
        return conteudo;
    }

    public void setConteudo(String conteudo) {
        this.conteudo = conteudo;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public String getEnviadoPor() {
        return enviadoPor;
    }

    public void setEnviadoPor(String enviadoPor) {
        this.enviadoPor = enviadoPor;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    @Override
    public String toString() {
        return "Mensagem{" +
                "enviadoPor='" + enviadoPor + '\'' +
                ", dataHora=" + dataHora +
                ", conteudo='" + conteudo + '\'' +
                '}';
    }
}
