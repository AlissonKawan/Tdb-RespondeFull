package model;

public class CanalComunicacao {
    //atributos

    private int id;
    private String nome; //nome do canal se é whatsApp ou qualquer outro
    private String descricao; //descrição da mensagem

    public CanalComunicacao(int id, String nome, String descricao) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
    }

    //construtor vazio para o DAO
    public CanalComunicacao() {}

    //metodos getter e setter

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
        return "CanalComunicacao{" +
                "id=" + id +
                ", nome='" + nome + '\'' +
                ", descricao='" + descricao + '\'' +
                '}';
    }
}
