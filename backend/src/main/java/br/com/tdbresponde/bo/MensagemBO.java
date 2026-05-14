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

    // CORREÇÃO 1: removido o @Inject @RestClient duplicado que aparecia
    // antes do método classificarMensagem — o correto é declarar apenas aqui,
    // como campo da classe, e não repetir antes do método.
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

    /**
     * Método principal que integra com o Python.
     * CORREÇÃO 2: removido o @Inject @RestClient que estava posicionado
     * incorretamente aqui antes do método — anotações de injeção não podem
     * ficar antes de métodos, apenas antes de campos da classe.
     * CORREÇÃO 3: adicionada normalização do status e do enviadoPor antes
     * de enviar para a API Python, garantindo que os valores estejam no
     * formato exato que ela aceita.
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

            // CORREÇÃO 3A: normaliza o status do atendimento para o formato
            // que a API Python aceita (ex: "Em andamento" → "EM_ATENDIMENTO")
            String statusNormalizado = normalizarStatus(atendimento.getStatus());

            // CORREÇÃO 3B: normaliza o enviadoPor — se for "ADMIN" (que o Python
            // não aceita), mapeia para "VOLUNTARIO" para não quebrar a chamada
            String enviadoPorNormalizado = normalizarEnviadoPorParaIA(mensagem.getEnviadoPor());

            // Cria o pacote de dados para o Python
            PredictRequest req = new PredictRequest(
                    mensagem.getConteudo(), enviadoPorNormalizado, canalNome,
                    atendimento.getPrioridade(), statusNormalizado, tipoPessoa, gravidade
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

    /**
     * Converte o status do Atendimento para o formato aceito pela API Python.
     * O banco pode guardar variações como "Aberto", "Em andamento", "ABERTO" etc.
     */
    private String normalizarStatus(String status) {
        if (status == null) return "ABERTO";
        switch (status.trim().toUpperCase().replace(" ", "_")) {
            case "ABERTO":           return "ABERTO";
            case "EM_ATENDIMENTO":
            case "EM_ANDAMENTO":     return "EM_ATENDIMENTO";
            case "ENCERRADO":        return "ENCERRADO";
            case "SOLICITADO":       return "SOLICITADO";
            default:                 return "ABERTO";
        }
    }

    /**
     * Converte o enviadoPor para um valor que a API Python aceita.
     * "ADMIN" não é reconhecido pelo Python, então é mapeado para "VOLUNTARIO".
     */
    private String normalizarEnviadoPorParaIA(String enviadoPor) {
        if (enviadoPor == null) return "BENEFICIARIO";
        switch (enviadoPor.trim().toUpperCase()) {
            case "VOLUNTARIO": return "VOLUNTARIO";
            case "ADMIN":      return "VOLUNTARIO"; // ADMIN age como voluntário para a IA
            default:           return "BENEFICIARIO";
        }
    }

}