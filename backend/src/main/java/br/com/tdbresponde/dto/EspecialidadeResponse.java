package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Especialidade;

public class EspecialidadeResponse {

    public int id;
    public String nome;
    public String descricao;

    public static EspecialidadeResponse from(Especialidade especialidade) {
        EspecialidadeResponse response = new EspecialidadeResponse();
        response.id = especialidade.getId();
        response.nome = especialidade.getNome();
        response.descricao = especialidade.getDescricao();
        return response;
    }
}
