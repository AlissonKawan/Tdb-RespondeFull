package br.com.tdbresponde.model;

public class Voluntario {
    private int id;
    private Integer contaId;
    private String nome;
    private String usuario;
    private String senha;
    private boolean acessoSigilo; // true se pode ver dados das Apolônias
    private boolean disponivel; //se esta ativo para atender
    private Especialidade especialidade; //objeto do tipo especialidade

    public Voluntario() {
    }

    public Voluntario(int id, String nome, String usuario, String senha, Boolean acessoSigilo, boolean disponivel, Especialidade especialidade, Integer contaId) {
        this.id = id;
        this.contaId = contaId;
        this.nome = nome;
        this.usuario = usuario;
        this.senha = senha;
        this.acessoSigilo = acessoSigilo;
        this.disponivel = disponivel;
        this.especialidade = especialidade;
    }

    public Voluntario(
            int id,
            String nome,
            String usuario,
            String senha,
            Boolean acessoSigilo,
            boolean disponivel,
            Especialidade especialidade
    ) {
        this.id = id;
        this.nome = nome;
        this.usuario = usuario;
        this.senha = senha;
        this.acessoSigilo = acessoSigilo;
        this.disponivel = disponivel;
        this.especialidade = especialidade;
    }

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

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public Boolean getAcessoSigilo() {
        return acessoSigilo;
    }

    public void setAcessoSigilo(Boolean acessoSigilo) {
        this.acessoSigilo = acessoSigilo;
    }

    public boolean isDisponivel() {
        return disponivel;
    }

    public void setDisponivel(boolean disponivel) {
        this.disponivel = disponivel;
    }

    public Especialidade getEspecialidade() {
        return especialidade;
    }

    public void setEspecialidade(Especialidade especialidade) {
        this.especialidade = especialidade;
    }

    public Integer getContaId() {
        return contaId;
    }

    public void setContaId(Integer contaId) {
        this.contaId = contaId;
    }

    public boolean isAcessoSigilo() {
        return acessoSigilo;
    }

    public void setAcessoSigilo(boolean acessoSigilo) {
        this.acessoSigilo = acessoSigilo;
    }

    @Override
    public String toString() {
        return "Voluntario{" +
                "id=" + id +
                ", contaId=" + contaId +
                ", nome='" + nome + '\'' +
                ", usuario='" + usuario + '\'' +
                ", acessoSigilo=" + acessoSigilo +
                ", disponivel=" + disponivel +
                ", especialidade=" + especialidade +
                '}';
    }
}
