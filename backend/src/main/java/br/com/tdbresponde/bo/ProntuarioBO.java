package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AgendaConsultaDAO;
import br.com.tdbresponde.dao.ProntuarioDAO;
import br.com.tdbresponde.model.AgendaConsulta;
import br.com.tdbresponde.model.Prontuario;
import br.com.tdbresponde.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class ProntuarioBO {

    @Inject
    ProntuarioDAO prontuarioDAO;

    @Inject
    AgendaConsultaDAO agendaDAO;

    public Prontuario registrarEvolucao(Prontuario prontuario) {
        if (prontuario == null) {
            throw new BusinessException("Os dados do prontuário são obrigatórios.");
        }

        if (prontuario.getAgendaId() != null) {
            if (prontuario.getAgendaId() < 0) {
                throw new BusinessException("ID da agenda inválido.");
            } else if (prontuario.getAgendaId() == 0) {
                prontuario.setAgendaId(null);
            }
        }

        if (prontuario.getAtendimentoId() != null) {
            if (prontuario.getAtendimentoId() < 0) {
                throw new BusinessException("ID do atendimento inválido.");
            } else if (prontuario.getAtendimentoId() == 0) {
                prontuario.setAtendimentoId(null);
            }
        }

        boolean temAgenda = prontuario.getAgendaId() != null && prontuario.getAgendaId() > 0;
        boolean temAtendimento = prontuario.getAtendimentoId() != null && prontuario.getAtendimentoId() > 0;

        if (!temAgenda && !temAtendimento) {
            throw new BusinessException("A consulta (agenda) ou o atendimento é obrigatório para o prontuário.");
        }

        if (prontuario.getVoluntarioId() <= 0) {
            throw new BusinessException("O dentista responsável é obrigatório.");
        }
        if (prontuario.getPaciente() == null || prontuario.getPaciente().trim().isEmpty()) {
            throw new BusinessException("O nome do paciente é obrigatório.");
        }
        if (prontuario.getPaciente().trim().length() > 255) {
            throw new BusinessException("O nome do paciente não pode exceder 255 caracteres.");
        }
        prontuario.setPaciente(prontuario.getPaciente().trim());

        if (prontuario.getTratamentoAtual() == null || prontuario.getTratamentoAtual().trim().isEmpty()) {
            throw new BusinessException("Você precisa registrar alguma evolução ou tratamento realizado.");
        }
        if (prontuario.getTratamentoAtual().trim().length() > 2000) {
            throw new BusinessException("A descrição do tratamento não pode exceder 2000 caracteres.");
        }
        prontuario.setTratamentoAtual(prontuario.getTratamentoAtual().trim());

        if (prontuario.getHistoricoMedico() != null) {
            if (prontuario.getHistoricoMedico().trim().length() > 1000) {
                throw new BusinessException("O histórico médico não pode exceder 1000 caracteres.");
            }
            prontuario.setHistoricoMedico(prontuario.getHistoricoMedico().trim());
        }

        // Sincroniza vinculos automaticamente quando disponivel
        if (agendaDAO != null) {
            if (temAgenda && !temAtendimento) {
                AgendaConsulta agenda = agendaDAO.buscarPorId(prontuario.getAgendaId());
                if (agenda != null && agenda.getAtendimentoId() != null && agenda.getAtendimentoId() > 0) {
                    prontuario.setAtendimentoId(agenda.getAtendimentoId());
                }
            } else if (temAtendimento && !temAgenda) {
                List<AgendaConsulta> agendas = agendaDAO.buscarPorAtendimento(prontuario.getAtendimentoId());
                if (agendas != null && !agendas.isEmpty()) {
                    prontuario.setAgendaId(agendas.get(agendas.size() - 1).getId());
                }
            }
        }

        return prontuarioDAO.inserir(prontuario);
    }

    public List<Prontuario> buscarPorAgenda(int agendaId) {
        if (agendaId <= 0) {
            throw new BusinessException("ID da agenda inválido.");
        }
        return prontuarioDAO.buscarPorAgenda(agendaId);
    }

    public List<Prontuario> buscarPorAtendimento(int atendimentoId) {
        if (atendimentoId <= 0) {
            throw new BusinessException("ID do atendimento inválido.");
        }
        return prontuarioDAO.buscarPorAtendimento(atendimentoId);
    }
}

