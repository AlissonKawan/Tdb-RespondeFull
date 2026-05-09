package br.com.tdbresponde.exception;

import java.time.LocalDateTime;

public class ErrorResponse {

    private String erro;
    private String mensagem;
    private LocalDateTime dataHora;

    public ErrorResponse() {
    }

    public ErrorResponse(String erro, String mensagem) {
        this.erro = erro;
        this.mensagem = mensagem;
        this.dataHora = LocalDateTime.now();
    }

    public String getErro() {
        return erro;
    }

    public void setErro(String erro) {
        this.erro = erro;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }
}
