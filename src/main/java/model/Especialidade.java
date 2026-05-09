package model;

public class Especialidade {
    private int id;
    private String nome; //nome da especialidade como Odontologia, Psicologia, Assesoria juridica
    private String descricao; // exemplo: Atendimento dental para crianças ou apoio psicologico para mulheres

    //construtor vazio para o Dao
    public Especialidade() {}

    //construtor cheio
    public Especialidade(int id, String descricao, String nome) {
        this.id = id;
        this.descricao = descricao;
        this.nome = nome;
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

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    @Override
    public String toString() {
        return "Especialidade{" +
                "id=" + id +
                ", nome='" + nome + '\'' +
                ", descricao='" + descricao + '\'' +
                '}';
    }
}
