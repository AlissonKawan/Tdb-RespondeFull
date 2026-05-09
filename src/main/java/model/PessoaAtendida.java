package model;

import java.time.LocalDate;

public abstract class PessoaAtendida {
    private int id;
    private String nomeCodificado; //nome real ou codinome
    private LocalDate data;
    private String telefone;
    private String email;


    public PessoaAtendida() {}

    public PessoaAtendida(int id, String nomeCodificado, LocalDate data, String telefone, String email) {
        this.id = id;
        this.nomeCodificado = nomeCodificado;
        this.data = data;
        this.telefone = telefone;
        this.email = email;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNomeCodificado() {
        return nomeCodificado;
    }

    public void setNomeCodificado(String nomeCodificado) {
        this.nomeCodificado = nomeCodificado;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "PessoaAtendida{" +
                "id=" + id +
                ", nomeCodificado='" + nomeCodificado + '\'' +
                ", data=" + data +
                ", telefone='" + telefone + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}


