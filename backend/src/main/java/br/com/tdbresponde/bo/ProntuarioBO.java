package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.ProntuarioDAO;
import br.com.tdbresponde.model.Prontuario;
import br.com.tdbresponde.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class ProntuarioBO {

    @Inject
    ProntuarioDAO prontuarioDAO;

    public Prontuario registrarEvolucao(Prontuario prontuario) {
        if (prontuario.getAgendaId() <= 0) {
            throw new BusinessException("A consulta (agenda) é obrigatória para o prontuário.");
        }
        if (prontuario.getVoluntarioId() <= 0) {
            throw new BusinessException("O dentista responsável é obrigatório.");
        }
        if (prontuario.getPaciente() == null || prontuario.getPaciente().trim().isEmpty()) {
            throw new BusinessException("O nome do paciente é obrigatório.");
        }
        if (prontuario.getTratamentoAtual() == null || prontuario.getTratamentoAtual().trim().isEmpty()) {
            throw new BusinessException("Você precisa registrar alguma evolução ou tratamento realizado.");
        }

        return prontuarioDAO.inserir(prontuario);
    }

    public List<Prontuario> buscarPorAgenda(int agendaId) {
        if (agendaId <= 0) {
            throw new BusinessException("ID da agenda inválido.");
        }
        return prontuarioDAO.buscarPorAgenda(agendaId);
    }
}
