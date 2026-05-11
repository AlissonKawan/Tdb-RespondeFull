package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.ContaUsuario;

import java.time.LocalDateTime;

public class AuthUserResponse {

    public int id;
    public String nome;
    public String email;
    public String tipoUsuario;
    public Boolean ativo;
    public LocalDateTime dataCriacao;

    public static AuthUserResponse from(ContaUsuario conta) {
        AuthUserResponse response = new AuthUserResponse();
        response.id = conta.getId();
        response.nome = conta.getNome();
        response.email = conta.getEmail();
        response.tipoUsuario = conta.getTipoUsuario() != null ? conta.getTipoUsuario().name() : null;
        response.ativo = conta.isAtivo();
        response.dataCriacao = conta.getDataCriacao();
        return response;
    }
}
