package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.MensagemContatoDAO;
import br.com.tdbresponde.dto.MensagemContatoRequest;
import br.com.tdbresponde.dto.PredictRequest;
import br.com.tdbresponde.dto.PredictResponse;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.MensagemContato;
import br.com.tdbresponde.service.ClassificadorService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import java.util.logging.Logger;
import java.util.List;

@ApplicationScoped
public class ContatoBO {
    
    private static final Logger LOGGER = Logger.getLogger(ContatoBO.class.getName());

    @Inject
    MensagemContatoDAO dao;

    @Inject
    @RestClient
    ClassificadorService classificadorService;

    public MensagemContato registrarMensagem(MensagemContatoRequest request) {
        if (request == null || request.nome == null || request.nome.trim().isEmpty() ||
            request.email == null || request.email.trim().isEmpty() ||
            request.mensagem == null || request.mensagem.trim().isEmpty()) {
            throw new BusinessException("Nome, email e mensagem sao obrigatorios.");
        }

        MensagemContato mensagem = new MensagemContato();
        mensagem.setNome(request.nome.trim());
        mensagem.setEmail(request.email.trim());
        mensagem.setMensagem(request.mensagem.trim());
        mensagem.setLida(false);

        // Chamar a IA
        try {
            PredictRequest predictRequest = new PredictRequest();
            predictRequest.conteudo = mensagem.getMensagem();
            predictRequest.enviadoPor = "BENEFICIARIO"; // padrão de remetente genérico
            predictRequest.canal = "site"; // canal de origem
            predictRequest.prioridadeAtendimento = 3;
            predictRequest.statusAtendimento = "NOVO";
            predictRequest.tipoPessoa = "OUTRO";
            predictRequest.gravidade = 3;

            PredictResponse predictResponse = classificadorService.classificar(predictRequest);
            if (predictResponse != null && predictResponse.categoriaPrevista != null) {
                mensagem.setClassificacaoIA(predictResponse.categoriaPrevista);
            } else {
                mensagem.setClassificacaoIA("informativo");
            }
        } catch (Exception e) {
            LOGGER.warning("Falha ao classificar mensagem com IA: " + e.getMessage());
            mensagem.setClassificacaoIA("informativo"); // Fallback
        }

        dao.inserir(mensagem);
        return mensagem;
    }

    public List<MensagemContato> listar() {
        return dao.listar();
    }
}
