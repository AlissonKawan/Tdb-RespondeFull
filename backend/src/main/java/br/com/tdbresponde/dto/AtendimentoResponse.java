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
    public int prioridade;
    public String status;
    public String descricao;
    public CanalComunicacaoResponse canalOrigem;
    public LocalDate dataAbertura;
    public LocalDate dataEncerramento;
    public String statusCheckin;
    public LocalDateTime horarioEnvioCheckin;
    public String previsaoCheckin;
    public Double confiancaCheckin;
    public String justificativaCheckin;
    public String tipoPessoa;
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
                response.gravidade = 3;
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
        if (atendimento.getCanalOrigem() != null) {
            response.canalOrigem = CanalComunicacaoResponse.from(atendimento.getCanalOrigem());
        }
        response.dataAbertura = atendimento.getDataAbertura();
        response.dataEncerramento = atendimento.getDataEncerramento();
        response.statusCheckin = atendimento.getStatusCheckin();
        response.horarioEnvioCheckin = atendimento.getHorarioEnvioCheckin();
        return response;
    }

    /**
     * Versao enriquecida com previsao da IA.
     * Usa o factory padrao e depois injeta os campos extras calculados pelo BO.
     */
    public static AtendimentoResponse from(Atendimento atendimento, String previsaoCheckin, Double confiancaCheckin, String justificativaCheckin) {
        AtendimentoResponse response = from(atendimento);
        response.previsaoCheckin = previsaoCheckin;
        response.confiancaCheckin = confiancaCheckin;
        response.justificativaCheckin = justificativaCheckin;
        return response;
    }
}
