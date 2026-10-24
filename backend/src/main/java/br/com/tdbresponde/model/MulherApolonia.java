package br.com.tdbresponde.model;

import java.time.LocalDate;

public class MulherApolonia extends PessoaAtendida {
    private String codinome;
    private Integer nivelRisco; //1 a 5, onde 5 é risco de vida
    private Boolean temBoletimOcorrencia;
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

    public Integer getNivelRisco() {
        return nivelRisco;
    }

    public void setNivelRisco(Integer nivelRisco) {
        this.nivelRisco = nivelRisco;
    }

    public boolean isNecessitaSigiloAbsoluto() {
        return necessitaSigiloAbsoluto;
    }

    public void setNecessitaSigiloAbsoluto(boolean necessitaSigiloAbsoluto) {
        this.necessitaSigiloAbsoluto = necessitaSigiloAbsoluto;
    }

    public boolean isTemBoletimOcorrencia() {
        return Boolean.TRUE.equals(temBoletimOcorrencia);
    }

    public Boolean getTemBoletimOcorrencia() {
        return temBoletimOcorrencia;
    }

    public void setTemBoletimOcorrencia(Boolean temBoletimOcorrencia) {
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
