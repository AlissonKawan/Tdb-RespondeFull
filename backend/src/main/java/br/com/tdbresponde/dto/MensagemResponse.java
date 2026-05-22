package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Mensagem;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

public class MensagemResponse {
    public int id;
    public Integer atendimentoId;
    public String conteudo;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime dataHora;
    public String enviadoPor;
    public CanalComunicacaoResponse canal;

    public static MensagemResponse from(Mensagem mensagem) {
        MensagemResponse response = new MensagemResponse();
        response.id = mensagem.getId();
        if (mensagem.getAtendimento() != null) {
            response.atendimentoId = mensagem.getAtendimento().getId();
        }
        response.conteudo = mensagem.getConteudo();
        response.dataHora = mensagem.getDataHora();
        response.enviadoPor = mensagem.getEnviadoPor();
        if (mensagem.getCanal() != null) {
            response.canal = CanalComunicacaoResponse.from(mensagem.getCanal());
        }
        return response;
    }
}
