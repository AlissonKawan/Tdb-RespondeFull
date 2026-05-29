package br.com.tdbresponde.bo;

import br.com.tdbresponde.client.CronogramaRestClient;
import br.com.tdbresponde.dto.ResumoSemanalDTO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.dto.TarefaCronogramaResponseDTO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.util.Map;

@ApplicationScoped
public class CronogramaBO {

    @Inject
    @RestClient
    CronogramaRestClient cronogramaClient;

    public Map<String, Object> criarTarefa(TarefaCronogramaDTO tarefa) {
        try {
            return cronogramaClient.criarTarefa(tarefa);
        } catch (Exception e) {
            handleException(e);
            return null;
        }
    }

    public TarefaCronogramaResponseDTO listarTarefasPorVoluntario(Long voluntarioId, String diaSemana, String status, String prioridade) {
        try {
            return cronogramaClient.listarTarefasPorVoluntario(voluntarioId, diaSemana, status, prioridade);
        } catch (Exception e) {
            handleException(e);
            return null;
        }
    }

    public TarefaCronogramaDTO buscarTarefa(Long idTarefa) {
        try {
            return cronogramaClient.buscarTarefa(idTarefa);
        } catch (Exception e) {
            handleException(e);
            return null;
        }
    }

    public Map<String, Object> atualizarTarefa(Long idTarefa, TarefaCronogramaDTO tarefa) {
        try {
            return cronogramaClient.atualizarTarefa(idTarefa, tarefa);
        } catch (Exception e) {
            handleException(e);
            return null;
        }
    }

    public Map<String, Object> excluirTarefa(Long idTarefa) {
        try {
            return cronogramaClient.excluirTarefa(idTarefa);
        } catch (Exception e) {
            handleException(e);
            return null;
        }
    }

    public ResumoSemanalDTO resumoSemanal(Long voluntarioId) {
        try {
            return cronogramaClient.resumoSemanal(voluntarioId);
        } catch (Exception e) {
            handleException(e);
            return null;
        }
    }

    private void handleException(Exception e) {
        if (e instanceof WebApplicationException) {
            WebApplicationException wae = (WebApplicationException) e;
            int status = wae.getResponse().getStatus();
            String errorMessage = "Erro na API de Cronograma";
            
            try {
                Map<String, Object> errorBody = wae.getResponse().readEntity(Map.class);
                if (errorBody != null && errorBody.containsKey("mensagem")) {
                    errorMessage = errorBody.get("mensagem").toString();
                }
            } catch (Exception ignored) {
            }

            if (status == 404) {
                throw new NotFoundException(errorMessage.equals("Erro na API de Cronograma") ? "Recurso não encontrado na API de Cronograma." : errorMessage);
            } else if (status == 400) {
                throw new BusinessException(errorMessage.equals("Erro na API de Cronograma") ? "Erro de validação enviado para a API de Cronograma." : errorMessage);
            } else {
                throw new BusinessException("Erro " + status + " na API de Cronograma: " + errorMessage);
            }
        } else if (e instanceof jakarta.ws.rs.ProcessingException) {
            throw new BusinessException("Não foi possível conectar à API de Cronograma. O serviço pode estar offline.");
        } else {
            throw new BusinessException("Erro inesperado de comunicação com a API de Cronograma: " + e.getMessage());
        }
    }
}
