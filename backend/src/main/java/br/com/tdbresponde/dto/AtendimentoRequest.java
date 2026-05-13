package br.com.tdbresponde.dto;

import java.time.LocalDate;

public class AtendimentoRequest {

    public Integer pessoaAtendidaId;
    public Integer voluntarioId;
    public Integer canalComunicacaoId;
    public int prioridade;
    public String status;
    public String descricao;
    public LocalDate dataAbertura;
    public LocalDate dataEncerramento;
}
