package model;

import java.time.LocalDate;

public class CriancaAdolescente extends PessoaAtendida {
    private int idade;
    private String nomeResponsavel;
    private String escola;
    private int gravidadeBucal; // de 1 a 5, onde 5 é grave

    public CriancaAdolescente() {}

    public CriancaAdolescente(int id, String nomeCodificado, LocalDate data, String telefone, String email, int idade, String nomeResponsavel, String escola, int gravidadeBucal) {
        super(id, nomeCodificado, data, telefone, email);
        this.idade = idade;
        this.nomeResponsavel = nomeResponsavel;
        this.escola = escola;
        this.gravidadeBucal = gravidadeBucal;
    }

    public int getIdade() {
        return idade;
    }

    public void setIdade(int idade) {
        this.idade = idade;
    }

    public String getNomeResponsavel() {
        return nomeResponsavel;
    }

    public void setNomeResponsavel(String nomeResponsavel) {
        this.nomeResponsavel = nomeResponsavel;
    }

    public String getEscola() {
        return escola;
    }

    public void setEscola(String escola) {
        this.escola = escola;
    }

    public int getGravidadeBucal() {
        return gravidadeBucal;
    }

    public void setGravidadeBucal(int gravidadeBucal) {
        this.gravidadeBucal = gravidadeBucal;
    }

    @Override
    public String toString() {
        return super.toString() + " + CriancaAdolescente{"
                + "idade=" + idade
                + ", nomeResponsavel='" + nomeResponsavel + '\''
                + ", escola='" + escola + '\''
                + ", gravidadeBucal=" + gravidadeBucal
                + '}';
    }
}
