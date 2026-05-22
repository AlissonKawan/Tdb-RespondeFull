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

@ApplicationScoped
public class MensagemBO {

    @Inject
    MensagemDAO mensagemDAO;

    @Inject
    AtendimentoBO atendimentoBO;

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

    @Inject
    com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional
    public Mensagem inserir(MensagemRequest request) {
        Mensagem mensagem = toModel(request);
        validar(mensagem);
        mensagemDAO.inserir(mensagem);
        
        // Broadcast the new message to active WebSocket sessions
        try {
            br.com.tdbresponde.dto.MensagemResponse response = br.com.tdbresponde.dto.MensagemResponse.from(mensagem);
            String json = objectMapper.writeValueAsString(response);
            System.out.println("[MensagemBO] Broadcast WS: atendimento=" + mensagem.getAtendimento().getId() + " json=" + json.substring(0, Math.min(json.length(), 100)));
            br.com.tdbresponde.resource.ChatWebSocket.broadcastText(String.valueOf(mensagem.getAtendimento().getId()), json);
        } catch (Exception e) {
            System.out.println("[MensagemBO] ERRO FATAL no WebSocket broadcast:");
            e.printStackTrace();
        }
        
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
}
