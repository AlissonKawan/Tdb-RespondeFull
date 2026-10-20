package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AgendaConsultaDAO;
import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.model.AgendaConsulta;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ConflictException;
import br.com.tdbresponde.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@ApplicationScoped
public class AgendaConsultaBO {

    private static final Pattern HORARIO_PATTERN = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");
    private static final Set<String> STATUS_PERMITIDOS = Set.of(
            "AGUARDANDO", "CONFIRMADO", "CONCLUIDO", "ENCERRADO", "CANCELADO"
    );

    @Inject
    AgendaConsultaDAO agendaDAO;

    @Inject
    AtendimentoDAO atendimentoDAO;

    public AgendaConsulta cadastrar(AgendaConsulta agenda) {
        validarAgenda(agenda);
        validarVinculoAtendimento(agenda);
        validarConflitoHorario(agenda, 0);
        return agendaDAO.inserir(agenda);
    }

    public List<AgendaConsulta> buscarPorVoluntario(int voluntarioId) {
        if (voluntarioId <= 0) {
            throw new BusinessException("ID do voluntario invalido");
        }
        return agendaDAO.buscarPorVoluntario(voluntarioId);
    }

    public List<AgendaConsulta> buscarPorAtendimento(int atendimentoId) {
        if (atendimentoId <= 0) {
            throw new BusinessException("ID do atendimento invalido");
        }
        return agendaDAO.buscarPorAtendimento(atendimentoId);
    }

    public AgendaConsulta buscarPorId(int id) {
        if (id <= 0) {
            throw new BusinessException("ID da agenda invalido");
        }
        AgendaConsulta agenda = agendaDAO.buscarPorId(id);
        if (agenda == null) {
            throw new NotFoundException("Agendamento nao encontrado");
        }
        return agenda;
    }

    public AgendaConsulta atualizar(int id, AgendaConsulta agenda) {
        if (id <= 0) {
            throw new BusinessException("ID da agenda invalido");
        }
        validarAgenda(agenda);
        validarVinculoAtendimento(agenda);
        validarConflitoHorario(agenda, id);
        agenda.setId(id);
        return agendaDAO.atualizar(agenda);
    }

    public void excluir(int id) {
        if (id <= 0) {
            throw new BusinessException("ID da agenda invalido");
        }
        agendaDAO.excluir(id);
    }

    private void validarAgenda(AgendaConsulta agenda) {
        if (agenda == null) {
            throw new BusinessException("Os dados do agendamento sao obrigatorios");
        }
        if (agenda.getPaciente() == null || agenda.getPaciente().trim().isEmpty()) {
            throw new BusinessException("O nome do paciente e obrigatorio");
        }
        if (agenda.getPaciente().trim().length() > 255) {
            throw new BusinessException("O nome do paciente nao pode exceder 255 caracteres");
        }
        agenda.setPaciente(agenda.getPaciente().trim());

        if (agenda.getDataConsulta() == null) {
            throw new BusinessException("A data da consulta e obrigatoria");
        }
        if (agenda.getVoluntarioId() <= 0) {
            throw new BusinessException("O voluntario responsavel e obrigatorio");
        }

        if (agenda.getAtendimentoId() != null) {
            if (agenda.getAtendimentoId() == 0) {
                agenda.setAtendimentoId(null);
            } else if (agenda.getAtendimentoId() < 0) {
                throw new BusinessException("ID do atendimento vinculado invalido");
            }
        }

        if (agenda.getTipo() == null || agenda.getTipo().trim().isEmpty()) {
            throw new BusinessException("O tipo da consulta e obrigatorio");
        }
        if (agenda.getTipo().trim().length() > 100) {
            throw new BusinessException("O tipo da consulta nao pode exceder 100 caracteres");
        }
        agenda.setTipo(agenda.getTipo().trim());

        if (agenda.getHorario() == null || agenda.getHorario().trim().isEmpty()) {
            throw new BusinessException("O horario da consulta e obrigatorio");
        }
        String horarioLimpo = agenda.getHorario().trim();
        if (!HORARIO_PATTERN.matcher(horarioLimpo).matches()) {
            throw new BusinessException("Horario invalido. Utilize o formato HH:mm");
        }
        agenda.setHorario(horarioLimpo);

        if (agenda.getStatus() == null || agenda.getStatus().trim().isEmpty()) {
            agenda.setStatus("AGUARDANDO");
        } else {
            String statusNormalizado = agenda.getStatus().trim().toUpperCase();
            if (!STATUS_PERMITIDOS.contains(statusNormalizado)) {
                throw new BusinessException("Status da consulta invalido: " + agenda.getStatus());
            }
            agenda.setStatus(statusNormalizado);
        }

        if (agenda.getTipoPessoa() == null || agenda.getTipoPessoa().trim().isEmpty()) {
            agenda.setTipoPessoa("OUTRO");
        } else {
            if (agenda.getTipoPessoa().trim().length() > 50) {
                throw new BusinessException("O tipo de pessoa nao pode exceder 50 caracteres");
            }
            agenda.setTipoPessoa(agenda.getTipoPessoa().trim());
        }
    }

    private void validarVinculoAtendimento(AgendaConsulta agenda) {
        if (agenda.getAtendimentoId() != null && agenda.getAtendimentoId() > 0 && atendimentoDAO != null) {
            if (atendimentoDAO.buscarPorId(agenda.getAtendimentoId()) == null) {
                throw new NotFoundException("Atendimento vinculado nao encontrado");
            }
        }
    }

    private void validarConflitoHorario(AgendaConsulta agenda, int ignoreId) {
        if (!"AGUARDANDO".equals(agenda.getStatus()) && !"CONFIRMADO".equals(agenda.getStatus())) {
            return;
        }
        List<AgendaConsulta> existentes = agendaDAO.buscarPorVoluntario(agenda.getVoluntarioId());
        if (existentes == null) {
            return;
        }
        for (AgendaConsulta c : existentes) {
            if (c.getId() != ignoreId
                    && ("AGUARDANDO".equals(c.getStatus()) || "CONFIRMADO".equals(c.getStatus()))
                    && agenda.getDataConsulta().equals(c.getDataConsulta())
                    && agenda.getHorario().equals(c.getHorario())) {
                throw new ConflictException("Ja existe uma consulta ativa agendada para este voluntario na mesma data e horario.");
            }
        }
    }
}

