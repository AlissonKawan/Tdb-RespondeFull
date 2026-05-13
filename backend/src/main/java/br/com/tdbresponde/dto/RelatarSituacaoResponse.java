package br.com.tdbresponde.dto;

public class RelatarSituacaoResponse {

    public int atendimentoId;
    public int pessoaAtendidaId;
    public String status;
    public String mensagem;

    public RelatarSituacaoResponse() {
    }

    public RelatarSituacaoResponse(int atendimentoId, int pessoaAtendidaId, String status, String mensagem) {
        this.atendimentoId = atendimentoId;
        this.pessoaAtendidaId = pessoaAtendidaId;
        this.status = status;
        this.mensagem = mensagem;
    }
}
