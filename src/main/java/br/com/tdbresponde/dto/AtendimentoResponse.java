package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Atendimento;

import java.time.LocalDate;

public class AtendimentoResponse {

    public int id;
    public Integer pessoaAtendidaId;
    public VoluntarioResponse voluntario;
    public int prioridade;
    public String status;
    public CanalComunicacaoResponse canalOrigem;
    public LocalDate dataAbertura;
    public LocalDate dataEncerramento;

    public static AtendimentoResponse from(Atendimento atendimento) {
        AtendimentoResponse response = new AtendimentoResponse();
        response.id = atendimento.getId();
        if (atendimento.getPessoaAtendida() != null) {
            response.pessoaAtendidaId = atendimento.getPessoaAtendida().getId();
        }
        if (atendimento.getVoluntario() != null) {
            response.voluntario = VoluntarioResponse.from(atendimento.getVoluntario());
        }
        response.prioridade = atendimento.getPrioridade();
        response.status = atendimento.getStatus();
        if (atendimento.getCanalOrigem() != null) {
            response.canalOrigem = CanalComunicacaoResponse.from(atendimento.getCanalOrigem());
        }
        response.dataAbertura = atendimento.getDataAbertura();
        response.dataEncerramento = atendimento.getDataEncerramento();
        return response;
    }
}
