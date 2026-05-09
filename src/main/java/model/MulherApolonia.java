package model;

import java.time.LocalDate;

public class MulherApolonia extends PessoaAtendida {
    private String codinome;
    private  int nivelRisco; //1 a 5, onde 5 é risco de vida
    private boolean temBoletimOcorrencia;
    private boolean necessitaSigiloAbsoluto = true; //sempre true para Apolonias

    public MulherApolonia() {}

    public MulherApolonia(int id, String nomeCodificado, LocalDate data, String telefone, String email, String codinome, boolean necessitaSigiloAbsoluto, int nivelRisco, boolean temBoletimOcorrencia) {
        super(id, nomeCodificado, data, telefone, email);
        this.codinome = codinome;
        this.necessitaSigiloAbsoluto = necessitaSigiloAbsoluto;
        this.nivelRisco = nivelRisco;
        this.temBoletimOcorrencia = temBoletimOcorrencia;
    }

    public String getCodinome() {
        return codinome;
    }

    public void setCodinome(String codinome) {
        this.codinome = codinome;
    }

    public int getNivelRisco() {
        return nivelRisco;
    }

    public void setNivelRisco(int nivelRisco) {
        this.nivelRisco = nivelRisco;
    }

    public boolean isNecessitaSigiloAbsoluto() {
        return necessitaSigiloAbsoluto;
    }

    public void setNecessitaSigiloAbsoluto(boolean necessitaSigiloAbsoluto) {
        this.necessitaSigiloAbsoluto = necessitaSigiloAbsoluto;
    }

    public boolean isTemBoletimOcorrencia() {
        return temBoletimOcorrencia;
    }

    public void setTemBoletimOcorrencia(boolean temBoletimOcorrencia) {
        this.temBoletimOcorrencia = temBoletimOcorrencia;
    }

    @Override
    public String toString() {
        return super.toString() + " + MulherApolonia{" +
                "codinome='" + codinome + '\'' +
                ", nivelRisco=" + nivelRisco +
                ", temBoletimOcorrencia=" + temBoletimOcorrencia +
                ", necessitaSigiloAbsoluto=" + necessitaSigiloAbsoluto +
                '}';
    }

}
