package br.com.tdbresponde.model;

import java.time.LocalDateTime;

public class MensagemContato {
    private int id;
    private String nome;
    private String email;
    private String mensagem;
    private LocalDateTime dataEnvio;
    private String classificacaoIA;
    private boolean lida;

    public MensagemContato() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public LocalDateTime getDataEnvio() {
        return dataEnvio;
    }

    public void setDataEnvio(LocalDateTime dataEnvio) {
        this.dataEnvio = dataEnvio;
    }

    public String getClassificacaoIA() {
        return classificacaoIA;
    }

    public void setClassificacaoIA(String classificacaoIA) {
        this.classificacaoIA = classificacaoIA;
    }

    public boolean isLida() {
        return lida;
    }

    public void setLida(boolean lida) {
        this.lida = lida;
    }

    @Override
    public String toString() {
        return "MensagemContato{" +
                "id=" + id +
                ", nome='" + nome + '\'' +
                ", email='" + email + '\'' +
                ", mensagem='" + mensagem + '\'' +
                ", dataEnvio=" + dataEnvio +
                ", classificacaoIA='" + classificacaoIA + '\'' +
                ", lida=" + lida +
                '}';
    }
}
