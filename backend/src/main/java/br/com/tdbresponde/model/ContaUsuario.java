package br.com.tdbresponde.model;

import java.time.LocalDateTime;

public class ContaUsuario {

    private int id;
    private String nome;
    private String usuario;
    private String tipoBeneficiario;
    private String modoIdentificacao;
    private String email;
    private String senhaHash;
    private TipoUsuario tipoUsuario;
    private boolean ativo = true;
    private LocalDateTime dataCriacao;

    public ContaUsuario() {
    }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public String getTipoBeneficiario() { return tipoBeneficiario; }
    public void setTipoBeneficiario(String tipoBeneficiario) { this.tipoBeneficiario = tipoBeneficiario; }
    public String getModoIdentificacao() { return modoIdentificacao; }
    public void setModoIdentificacao(String modoIdentificacao) { this.modoIdentificacao = modoIdentificacao; }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public void setSenhaHash(String senhaHash) {
        this.senhaHash = senhaHash;
    }

    public TipoUsuario getTipoUsuario() {
        return tipoUsuario;
    }

    public void setTipoUsuario(TipoUsuario tipoUsuario) {
        this.tipoUsuario = tipoUsuario;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }
}
