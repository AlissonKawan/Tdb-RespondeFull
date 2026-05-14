package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.MensagemDAO;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CanalComunicacao;
import br.com.tdbresponde.model.Mensagem;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import br.com.tdbresponde.dto.PredictRequest;
import br.com.tdbresponde.dto.PredictResponse;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.service.ClassificadorService;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class MensagemBO {

    @Inject
    MensagemDAO mensagemDAO;

    @Inject
    AtendimentoBO atendimentoBO;

    @Inject
    @RestClient
    ClassificadorService classificadorService;


    public List<Mensagem> listarPorAtendimento(int atendimentoId) {
        if (atendimentoId <= 0) {
            throw new BusinessException("ID do atendimento deve ser valido");
        }
        atendimentoBO.buscarPorId(atendimentoId);
        return mensagemDAO.buscarPorAtendimento(atendimentoId);
    }

    public Mensagem buscarPorId(int id) {
        Mensagem mensagem = mensagemDAO.buscarPorId(id);
        if (mensagem == null) {
            throw new NotFoundException("Mensagem nao encontrada");
        }
        return mensagem;
    }

    @Transactional
    public Mensagem inserir(MensagemRequest request) {
        Mensagem mensagem = toModel(request);
        validar(mensagem);
        mensagemDAO.inserir(mensagem);
        return mensagem;
    }

    private Mensagem toModel(MensagemRequest request) {
        Mensagem mensagem = new Mensagem();
        if (request != null) {
            if (request.atendimentoId != null) {
                Atendimento atendimento = atendimentoBO.buscarPorId(request.atendimentoId);
                mensagem.setAtendimento(atendimento);
            }
            if (request.canalId != null) {
                CanalComunicacao canal = new CanalComunicacao();
                canal.setId(request.canalId);
                mensagem.setCanal(canal);
            }
            mensagem.setConteudo(request.conteudo);
            mensagem.setEnviadoPor(normalizarEnviadoPor(request.enviadoPor));
            mensagem.setDataHora(LocalDateTime.now());
        }
        return mensagem;
    }

    private void validar(Mensagem mensagem) {
        if (mensagem.getAtendimento() == null || mensagem.getAtendimento().getId() <= 0) {
            throw new BusinessException("ID do atendimento e obrigatorio");
        }
        if (mensagem.getConteudo() == null || mensagem.getConteudo().trim().isEmpty()) {
            throw new BusinessException("Conteudo da mensagem e obrigatorio");
        }
        if (mensagem.getEnviadoPor() == null) {
            throw new BusinessException("Informe quem enviou a mensagem");
        }
        String status = mensagem.getAtendimento().getStatus();
        String statusNormalizado = status != null ? status.trim().toUpperCase() : "";
        if ("ENCERRADO".equals(statusNormalizado) || "CANCELADO".equals(statusNormalizado)) {
            throw new BusinessException("Nao e possivel enviar mensagem em atendimento encerrado ou cancelado");
        }
    }

    private String normalizarEnviadoPor(String enviadoPor) {
        if (enviadoPor == null || enviadoPor.trim().isEmpty()) {
            return null;
        }

        String valor = enviadoPor.trim().toUpperCase().replace(' ', '_');
        if ("VOLUNTARIO".equals(valor) || "BENEFICIARIO".equals(valor) || "ADMIN".equals(valor)) {
            return valor;
        }
        throw new BusinessException("Remetente deve ser BENEFICIARIO, VOLUNTARIO ou ADMIN");
    }

    // Injeta o serviço de IA que criamos acima
    @Inject
    @RestClient
    /**
     * Método principal que integra com o Python.
     */
    public PredictResponse classificarMensagem(Mensagem mensagem) {
        // Imprime no console para sabermos que o Java tentou chamar a IA
        System.out.println("DEBUG: Iniciando chamada para a API Python...");
        try {
            // Pega o atendimento da mensagem
            Atendimento atendimento = mensagem.getAtendimento();
            String tipoPessoa = "OUTRO";
            int gravidade = 3;

            // Lógica para descobrir o tipo de pessoa e a gravidade específica dela
            if (atendimento.getPessoaAtendida() instanceof CriancaAdolescente c) {
                tipoPessoa = "CRIANCA_ADOLESCENTE";
                gravidade = c.getGravidadeBucal();
            } else if (atendimento.getPessoaAtendida() instanceof MulherApolonia m) {
                tipoPessoa = "MULHER_APOLONIA";
                gravidade = m.getNivelRisco();
            }

            // Traduz o canal para os nomes que a IA conhece
            String canalNome = "whatsapp";
            if (mensagem.getCanal() != null && mensagem.getCanal().getNome() != null) {
                String nome = mensagem.getCanal().getNome().toLowerCase();
                if (nome.contains("email")) canalNome = "email";
                else if (nome.contains("tel") || nome.contains("fone")) canalNome = "telefone";
            }

            // Cria o pacote de dados para o Python
            PredictRequest req = new PredictRequest(
                    mensagem.getConteudo(), mensagem.getEnviadoPor(), canalNome,
                    atendimento.getPrioridade(), atendimento.getStatus(), tipoPessoa, gravidade
            );

            // Faz a chamada real para a API Python
            PredictResponse resp = classificadorService.classificar(req);
            // Imprime o resultado no console do Java
            System.out.println("DEBUG: IA respondeu: " + resp.categoriaPrevista);
            return resp;
        } catch (Exception e) {
            // Se a IA falhar (ex: Python desligado), mostra o erro e não trava o sistema
            System.err.println("Erro na integração com a IA: " + e.getMessage());
            return null;
        }
    }

}
