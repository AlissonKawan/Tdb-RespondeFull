package br.com.tdbresponde.model;

import java.time.LocalDate;

public class PessoaAtendidaBase extends PessoaAtendida {

    public PessoaAtendidaBase() {
    }

    public PessoaAtendidaBase(int id, String nomeCodificado, LocalDate data, String telefone, String email) {
        super(id, nomeCodificado, data, telefone, email);
    }
}
