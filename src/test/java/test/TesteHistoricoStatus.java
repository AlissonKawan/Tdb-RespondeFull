package test;

import model.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TesteHistoricoStatus {

    public static void main(String[] args) {

        // Especialidade
        Especialidade especialidade = new Especialidade(
                1,
                "Tratamento Bucal Gratuito",
                "Odontologia"
        );

        // Voluntário (quem altera o status)
        Voluntario voluntario = new Voluntario(
                1,
                "Alisson",
                "Akes",
                "12345",
                true,
                true,
                especialidade
        );

        // Canal de comunicação
        CanalComunicacao canal = new CanalComunicacao(
                1,
                "WhatsApp",
                "Dor no dente"
        );

        // Pessoa atendida (criança/adolescente)
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

        // Atendimento
        Atendimento atendimento = new Atendimento(
                canal,
                LocalDate.of(2026, 2, 25),
                LocalDate.of(2026, 2, 25),
                3,
                crianca,
                2,
                "Aberto",
                voluntario
        );

        // Histórico 1: Aberto → Em andamento
        HistoricoStatus h1 = new HistoricoStatus(
                voluntario,
                atendimento, LocalDateTime.of(2026, 2, 25, 10, 0)
                , 1, "Aberto", "Em andamento");

        // Histórico 2: Em andamento → Encerrado
        HistoricoStatus h2 = new HistoricoStatus(
                voluntario,
                atendimento,
                LocalDateTime.of(2026, 2, 25, 12, 0),
                1,
                "Em andamento", "Encerrado"
        );

        // Impressão
        System.out.println(h1);
        System.out.println(h2);
    }
}