package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.ContaUsuario;

import java.time.LocalDateTime;

public class AuthUserResponse {

    public int id;
    public String nome;
    public String usuario;
    public String tipoBeneficiario;
    public String modoIdentificacao;
    public String email;
    public String tipoUsuario;
    public Boolean ativo;
    public LocalDateTime dataCriacao;

    public Integer voluntarioId;
    public Integer beneficiarioId;
    public String statusCro;
    public String telefone;
    public Integer idade;
    public String nomeResponsavel;
    public String escola;
    public String codinome;

    public static AuthUserResponse from(ContaUsuario conta) {
        AuthUserResponse response = new AuthUserResponse();

        response.id = conta.getId();
        response.nome = conta.getNome();
        response.usuario = conta.getUsuario();
        response.tipoBeneficiario = conta.getTipoBeneficiario();
        response.modoIdentificacao = conta.getModoIdentificacao();
        response.email = conta.getEmail();
        response.tipoUsuario = conta.getTipoUsuario() != null ? conta.getTipoUsuario().name() : null;
        response.ativo = conta.isAtivo();
        response.dataCriacao = conta.getDataCriacao();

        return response;
    }

    public static AuthUserResponse from(ContaUsuario conta, Integer voluntarioId, Integer beneficiarioId) {
        AuthUserResponse response = from(conta);
        response.voluntarioId = voluntarioId;
        response.beneficiarioId = beneficiarioId;
        return response;
    }
}
