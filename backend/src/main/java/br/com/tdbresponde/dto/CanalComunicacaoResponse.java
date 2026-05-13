package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.CanalComunicacao;

public class CanalComunicacaoResponse {

    public int id;
    public String nome;
    public String descricao;

    public static CanalComunicacaoResponse from(CanalComunicacao canal) {
        CanalComunicacaoResponse response = new CanalComunicacaoResponse();
        response.id = canal.getId();
        response.nome = canal.getNome();
        response.descricao = canal.getDescricao();
        return response;
    }
}
