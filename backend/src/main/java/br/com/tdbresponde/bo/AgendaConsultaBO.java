package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AgendaConsultaDAO;
import br.com.tdbresponde.model.AgendaConsulta;
import br.com.tdbresponde.exception.BusinessException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class AgendaConsultaBO {

    @Inject
    AgendaConsultaDAO agendaDAO;

    public AgendaConsulta cadastrar(AgendaConsulta agenda) {
        validarAgenda(agenda);
        return agendaDAO.inserir(agenda);
    }

    public List<AgendaConsulta> buscarPorVoluntario(int voluntarioId) {
        if (voluntarioId <= 0) {
            throw new BusinessException("ID do voluntario invalido");
        }
        return agendaDAO.buscarPorVoluntario(voluntarioId);
    }

    public AgendaConsulta atualizar(int id, AgendaConsulta agenda) {
        validarAgenda(agenda);
        agenda.setId(id);
        return agendaDAO.atualizar(agenda);
    }

    public void excluir(int id) {
        agendaDAO.excluir(id);
    }

    private void validarAgenda(AgendaConsulta agenda) {
        if (agenda.getPaciente() == null || agenda.getPaciente().trim().isEmpty()) {
            throw new BusinessException("O nome do paciente e obrigatorio");
        }
        if (agenda.getDataConsulta() == null) {
            throw new BusinessException("A data da consulta e obrigatoria");
        }
        if (agenda.getVoluntarioId() <= 0) {
            throw new BusinessException("O voluntario responsavel e obrigatorio");
        }
    }
}
