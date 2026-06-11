package br.com.tdbresponde.model;

import java.util.ArrayList;
import java.util.List;

public class Voluntario {
    private int id;
    private Integer contaId;
    private String nome;
    private String usuario;
    private String senha;
    private boolean acessoSigilo; // true se pode ver dados das Apolônias
    private boolean disponivel; //se esta ativo para atender
    private String statusAprovacao;
    private String motivoVoluntariado;
    private Especialidade especialidade; //mantido para compatibilidade com telas antigas
    private List<Especialidade> especialidades = new ArrayList<>();

    // Novos campos de Indicação e Ranking
    private String codigoIndicacao;
    private Integer pontosIndicacao = 0;
    private Integer idVoluntarioIndicador;

    // Campos de validação profissional
    private String cro;
    private String ufCro;

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

    public String getStatusAprovacao() {
        return statusAprovacao;
    }

    public void setStatusAprovacao(String statusAprovacao) {
        this.statusAprovacao = statusAprovacao;
    }

    public String getMotivoVoluntariado() {
        return motivoVoluntariado;
    }

    public void setMotivoVoluntariado(String motivoVoluntariado) {
        this.motivoVoluntariado = motivoVoluntariado;
    }

    public Especialidade getEspecialidade() {
        if (especialidade == null && especialidades != null && !especialidades.isEmpty()) {
            return especialidades.get(0);
        }
        return especialidade;
    }

    public void setEspecialidade(Especialidade especialidade) {
        this.especialidade = especialidade;
        if (especialidade != null && especialidades.stream().noneMatch(e -> e.getId() == especialidade.getId())) {
            especialidades.add(especialidade);
        }
    }

    public List<Especialidade> getEspecialidades() {
        return especialidades;
    }

    public void setEspecialidades(List<Especialidade> especialidades) {
        this.especialidades = especialidades != null ? especialidades : new ArrayList<>();
        this.especialidade = this.especialidades.isEmpty() ? null : this.especialidades.get(0);
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

    public String getCodigoIndicacao() {
        return codigoIndicacao;
    }

    public void setCodigoIndicacao(String codigoIndicacao) {
        this.codigoIndicacao = codigoIndicacao;
    }

    public Integer getPontosIndicacao() {
        return pontosIndicacao;
    }

    public void setPontosIndicacao(Integer pontosIndicacao) {
        this.pontosIndicacao = pontosIndicacao;
    }

    public Integer getIdVoluntarioIndicador() {
        return idVoluntarioIndicador;
    }

    public void setIdVoluntarioIndicador(Integer idVoluntarioIndicador) {
        this.idVoluntarioIndicador = idVoluntarioIndicador;
    }

    public String getCro() {
        return cro;
    }

    public void setCro(String cro) {
        this.cro = cro;
    }

    public String getUfCro() {
        return ufCro;
    }

    public void setUfCro(String ufCro) {
        this.ufCro = ufCro;
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
                ", statusAprovacao='" + statusAprovacao + '\'' +
                ", motivoVoluntariado='" + motivoVoluntariado + '\'' +
                ", especialidades=" + especialidades +
                ", codigoIndicacao='" + codigoIndicacao + '\'' +
                ", pontosIndicacao=" + pontosIndicacao +
                ", idVoluntarioIndicador=" + idVoluntarioIndicador +
                ", cro='" + cro + '\'' +
                ", ufCro='" + ufCro + '\'' +
                '}';
    }
}
