package test;

import model.MulherApolonia;
import model.PessoaAtendida;

import java.time.LocalDate;

public class TesteMulherApolonia {

    public static void main(String[] args) {

        PessoaAtendida p2 = new MulherApolonia(
                2,
                "Codinome protegido",
                LocalDate.of(2026, 1, 15),
                "11888888",
                "contato@protecao.org",
                "Maria A",
                true,
                5,
                true
        );

        System.out.println(p2);
    }
}