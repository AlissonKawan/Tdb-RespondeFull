package model;

public class Voluntario {
    private int id;
    private String nome;
    private String usuario;
    private String senha;
    private boolean acessoSigilo; // true se pode ver dados das Apolônias
    private boolean disponivel; //se esta ativo para atender
    private Especialidade especialidade; //objeto do tipo especialidade

    public Voluntario() {
    }

    public Voluntario(int id, String nome, String usuario, String senha, Boolean acessoSigilo, boolean disponivel, Especialidade especialidade) {
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

    @Override
    public String toString() {
        return "Voluntario{" +
                "id=" + id +
                ", nome='" + nome + '\'' +
                ", usuario='" + usuario + '\'' +
                ", senha='" + senha + '\'' +
                ", acessoSigilo=" + acessoSigilo +
                ", disponivel=" + disponivel +
                ", especialidade=" + especialidade +
                '}';
    }
}
