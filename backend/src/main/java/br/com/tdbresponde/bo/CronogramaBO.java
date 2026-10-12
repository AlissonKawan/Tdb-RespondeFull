package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.CronogramaDAO;
import br.com.tdbresponde.dto.ResumoSemanalDTO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.dto.TarefaCronogramaResponseDTO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class CronogramaBO {
    private static final List<String> DIAS = List.of("Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado");
    private static final List<String> PRIORIDADES = List.of("Baixa", "Media", "Alta", "Urgente");

    @Inject
    CronogramaDAO dao;

    public Map<String, Object> criarTarefa(TarefaCronogramaDTO tarefa) {
        validar(tarefa, true);
        tarefa.setStatus("Pendente");
        return Map.of("mensagem", "Tarefa cadastrada com sucesso!", "id_tarefa", dao.inserir(tarefa));
    }

    public TarefaCronogramaResponseDTO listarTarefasPorVoluntario(Long voluntarioId, String diaSemana, String status, String prioridade) {
        validarId(voluntarioId);
        TarefaCronogramaResponseDTO resposta = new TarefaCronogramaResponseDTO();
        resposta.setVoluntario_id(voluntarioId);
        resposta.setTarefas(dao.listarPorVoluntario(voluntarioId, diaSemana, status, prioridade));
        resposta.setTotal(resposta.getTarefas().size());
        return resposta;
    }

    public TarefaCronogramaDTO buscarTarefa(Long idTarefa) {
        validarId(idTarefa);
        TarefaCronogramaDTO tarefa = dao.buscarPorId(idTarefa);
        if (tarefa == null) throw naoEncontrada(idTarefa);
        return tarefa;
    }

    public Map<String, Object> atualizarTarefa(Long idTarefa, TarefaCronogramaDTO tarefa) {
        validarId(idTarefa);
        validar(tarefa, false);
        tarefa.setStatus(normalizarStatus(tarefa.getStatus()));
        if (!dao.atualizar(idTarefa, tarefa)) throw naoEncontrada(idTarefa);
        return Map.of("mensagem", "Tarefa atualizada com sucesso!", "id_tarefa", idTarefa);
    }

    public Map<String, Object> excluirTarefa(Long idTarefa) {
        validarId(idTarefa);
        if (!dao.excluir(idTarefa)) throw naoEncontrada(idTarefa);
        return Map.of("mensagem", "Tarefa excluída com sucesso!", "id_tarefa", idTarefa);
    }

    public ResumoSemanalDTO resumoSemanal(Long voluntarioId) {
        validarId(voluntarioId);
        ResumoSemanalDTO resposta = new ResumoSemanalDTO();
        resposta.setVoluntario_id(voluntarioId);
        resposta.setResumo(dao.resumoSemanal(voluntarioId));
        return resposta;
    }

    private void validar(TarefaCronogramaDTO tarefa, boolean criacao) {
        if (tarefa == null) throw new BusinessException("Informe os dados da tarefa.");
        if (criacao) {
            if (tarefa.getIdVoluntario() == null) throw new BusinessException("Campo 'id_voluntario' é obrigatório.");
            validarId(tarefa.getIdVoluntario());
        }
        obrigatorio(tarefa.getTipo(), "tipo");
        obrigatorio(tarefa.getDiaSemana(), "dia_semana");
        obrigatorio(tarefa.getTitulo(), "titulo");
        obrigatorio(tarefa.getPrioridade(), "prioridade");
        if (!criacao) obrigatorio(tarefa.getStatus(), "status");
        if (!DIAS.contains(tarefa.getDiaSemana())) throw new BusinessException("Dia da semana inválido. Use: " + DIAS);
        if (!PRIORIDADES.contains(tarefa.getPrioridade())) throw new BusinessException("Prioridade inválida. Use: " + PRIORIDADES);
    }

    private void obrigatorio(String valor, String campo) {
        if (valor == null || valor.isBlank()) throw new BusinessException("Campo '" + campo + "' é obrigatório.");
    }

    private void validarId(Long id) {
        if (id == null || id <= 0) throw new BusinessException("ID deve ser maior que zero.");
    }

    private String normalizarStatus(String status) {
        return switch (status) {
            case "Pendente", "PENDENTE" -> "Pendente";
            case "Concluido", "Concluida", "Concluído", "Concluída", "CONCLUIDO", "CONCLUIDA" -> "Concluida";
            case "Em andamento", "Cancelada", "Atrasada" -> status;
            default -> throw new BusinessException("Status inválido. Use: [Pendente, Em andamento, Concluida, Cancelada, Atrasada]");
        };
    }

    private NotFoundException naoEncontrada(Long id) {
        return new NotFoundException("Tarefa " + id + " não encontrada.");
    }
}
