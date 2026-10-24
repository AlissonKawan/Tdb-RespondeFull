package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.MulherApolonia;

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
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    public Integer prioridade;
    public String status;
    public String descricao;
    public LocalDate dataAbertura;
    public LocalDate dataEncerramento;
    public LocalDateTime dataAtualizacao;
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    public Boolean ultimaMensagemDoBeneficiario;
    public String statusCheckin;
    public LocalDateTime horarioEnvioCheckin;
    public String tipoPessoa;
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    public Integer gravidade;

    public static AtendimentoResponse from(Atendimento atendimento) {
        AtendimentoResponse response = new AtendimentoResponse();
        response.id = atendimento.getId();
        if (atendimento.getPessoaAtendida() != null) {
            response.pessoaAtendidaId = atendimento.getPessoaAtendida().getId();
            response.beneficiarioId = atendimento.getPessoaAtendida().getId();
            response.pessoaAtendidaNome = atendimento.getPessoaAtendida().getNomeCodificado();
            response.pessoaAtendidaEmail = atendimento.getPessoaAtendida().getEmail();
            response.pessoaAtendidaTelefone = atendimento.getPessoaAtendida().getTelefone();
            
            if (atendimento.getPessoaAtendida() instanceof CriancaAdolescente) {
                response.tipoPessoa = "CRIANCA_ADOLESCENTE";
                response.gravidade = ((CriancaAdolescente) atendimento.getPessoaAtendida()).getGravidadeBucal();
            } else if (atendimento.getPessoaAtendida() instanceof MulherApolonia) {
                response.tipoPessoa = "MULHER_APOLONIA";
                response.gravidade = ((MulherApolonia) atendimento.getPessoaAtendida()).getNivelRisco();
            } else {
                response.tipoPessoa = atendimento.getPessoaAtendida().getTipo();
                if (response.tipoPessoa == null) {
                    response.tipoPessoa = "OUTRO";
                }
                response.gravidade = null;
            }
        }
        if (atendimento.getVoluntario() != null) {
            response.voluntarioId = atendimento.getVoluntario().getId();
            response.nomeVoluntario = atendimento.getVoluntario().getNome();
            response.voluntario = VoluntarioResponse.from(atendimento.getVoluntario());
        }
        response.prioridade = atendimento.getPrioridade();
        response.status = atendimento.getStatus();
        response.descricao = atendimento.getDescricao();
        response.dataAbertura = atendimento.getDataAbertura();
        response.dataEncerramento = atendimento.getDataEncerramento();
        response.dataAtualizacao = atendimento.getDataAtualizacao();
        response.ultimaMensagemDoBeneficiario = atendimento.getUltimaMensagemDoBeneficiario();
        response.statusCheckin = atendimento.getStatusCheckin();
        response.horarioEnvioCheckin = atendimento.getHorarioEnvioCheckin();
        return response;
    }

    /** Dados de acompanhamento, sem classificacoes internas nem cadastro completo do voluntario. */
    public static AtendimentoResponse paraBeneficiario(Atendimento atendimento) {
        AtendimentoResponse response = from(atendimento);
        response.prioridade = null;
        response.gravidade = null;
        response.voluntario = null;
        response.ultimaMensagemDoBeneficiario = null;
        response.statusCheckin = null;
        response.horarioEnvioCheckin = null;
        return response;
    }

    /** Lista positiva: a fila nao recebe identidade, contatos ou relato antes da atribuicao. */
    public static AtendimentoResponse resumoFila(Atendimento atendimento) {
        AtendimentoResponse response = new AtendimentoResponse();
        response.id = atendimento.getId();
        response.status = atendimento.getStatus();
        response.prioridade = atendimento.getPrioridade();
        response.dataAbertura = atendimento.getDataAbertura();
        if (atendimento.getPessoaAtendida() instanceof MulherApolonia) {
            response.tipoPessoa = "MULHER_APOLONIA";
        } else if (atendimento.getPessoaAtendida() instanceof CriancaAdolescente) {
            response.tipoPessoa = "CRIANCA_ADOLESCENTE";
        } else if (atendimento.getPessoaAtendida() != null) {
            response.tipoPessoa = atendimento.getPessoaAtendida().getTipo();
        }
        return response;
    }

}
