package test;

import model.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TesteMensagem {

    public static void main(String[] args) {

        Voluntario voluntario = new Voluntario(
                1,
                "Alisson",
                "Akes",
                "12345",
                true,
                true,
                new Especialidade(
                        1,
                        "Tratamento Bucal Gratuito",
                        "Odontologia"
                )
        );

        CanalComunicacao zap = new CanalComunicacao(
                1,
                "WhatsApp",
                "Mensagens instantâneas"
        );

        PessoaAtendida crianca = new CriancaAdolescente(
                2,
                "Pedro",
                LocalDate.of(2026, 2, 25),
                "11999999",
                "crianca@email.com",
                12,
                "Jose",
                "Teotonio",
                4
        );

        Atendimento at1 = new Atendimento(
                zap,
                LocalDate.of(2026, 2, 25),
                LocalDate.of(2026, 2, 25),
                3,
                crianca,
                2,
                "Resolvido",
                voluntario
        );

        Mensagem ms1 = new Mensagem(
                zap,
                at1,
                "Ola como esta a dor hoje?",
                LocalDateTime.of(2026, 2, 25, 12, 14),
                "Enviado por Alisson",
                2
        );

        Mensagem ms2 = new Mensagem(
                zap,
                at1,
                "Esta piorando preciso de ajuda",
                LocalDateTime.of(2026, 2, 25, 12, 30),
                "Pessoa atendida",
                3
        );

        System.out.println(ms1);
        System.out.println(ms2);
    }
}