package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Atendimento;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AtendimentoResponse {

    public int id;
    public Integer pessoaAtendidaId;
    public Integer beneficiarioId;
    public String pessoaAtendidaNome;
    public String pessoaAtendidaEmail;
    public String pessoaAtendidaTelefone;
    public Integer voluntarioId;
    public String nomeVoluntario;
    public VoluntarioResponse voluntario;
    public int prioridade;
    public String status;
    public String descricao;
    public CanalComunicacaoResponse canalOrigem;
    public LocalDate dataAbertura;
    public LocalDate dataEncerramento;
    public String statusCheckin;
    public LocalDateTime horarioEnvioCheckin;

    public static AtendimentoResponse from(Atendimento atendimento) {
        AtendimentoResponse response = new AtendimentoResponse();
        response.id = atendimento.getId();
        if (atendimento.getPessoaAtendida() != null) {
            response.pessoaAtendidaId = atendimento.getPessoaAtendida().getId();
            response.beneficiarioId = atendimento.getPessoaAtendida().getId();
            response.pessoaAtendidaNome = atendimento.getPessoaAtendida().getNomeCodificado();
            response.pessoaAtendidaEmail = atendimento.getPessoaAtendida().getEmail();
            response.pessoaAtendidaTelefone = atendimento.getPessoaAtendida().getTelefone();
        }
        if (atendimento.getVoluntario() != null) {
            response.voluntarioId = atendimento.getVoluntario().getId();
            response.nomeVoluntario = atendimento.getVoluntario().getNome();
            response.voluntario = VoluntarioResponse.from(atendimento.getVoluntario());
        }
        response.prioridade = atendimento.getPrioridade();
        response.status = atendimento.getStatus();
        response.descricao = atendimento.getDescricao();
        if (atendimento.getCanalOrigem() != null) {
            response.canalOrigem = CanalComunicacaoResponse.from(atendimento.getCanalOrigem());
        }
        response.dataAbertura = atendimento.getDataAbertura();
        response.dataEncerramento = atendimento.getDataEncerramento();
        response.statusCheckin = atendimento.getStatusCheckin();
        response.horarioEnvioCheckin = atendimento.getHorarioEnvioCheckin();
        return response;
    }
}
