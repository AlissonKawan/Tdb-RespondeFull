package test;

import model.CriancaAdolescente;
import model.PessoaAtendida;

import java.time.LocalDate;

public class TesteCriancaAdolescente {
    public static void main(String[] args) {
        PessoaAtendida p1 = new CriancaAdolescente(1, "Ana silva", LocalDate.of(2026 , 2, 25), "11999999", "responsavel@email.com" , 14, "João silva", "Escola municipal XYZ" , 4);

        System.out.println(p1);
    }
}
