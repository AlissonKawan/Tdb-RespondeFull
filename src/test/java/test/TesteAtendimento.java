package test;

import model.*;

import java.time.LocalDate;

public class TesteAtendimento {

    public static void main(String[] args) {

        // Pessoa atendida - Criança/Adolescente
        PessoaAtendida crianca = new CriancaAdolescente(
                1,
                "Pedro",
                LocalDate.of(2026, 2, 25),
                "119999900",
                "contatocrianca@email.com",
                12,
                "Maria",
                "Escola Setubal",
                4
        );

        // Pessoa atendida - Mulher Apolonia
        PessoaAtendida mulher = new MulherApolonia(
                2,
                "Nome restrito",
                LocalDate.of(2026, 2, 25),
                "11999999",
                "mulherrestrita@gmail.com",
                "Antonia P.",
                true,
                5,
                true
        );

        // Canal de comunicação
        CanalComunicacao canal = new CanalComunicacao(
                1,
                "WhatsApp",
                "Mensagens instantâneas"
        );

        // Especialidade
        Especialidade especialidade = new Especialidade(
                1,
                "Apoio psicológico",
                "Psicologia"
        );

        // Voluntário
        Voluntario voluntario = new Voluntario(
                1,
                "Alisson",
                "Akes",
                "12345",
                true,
                true,
                especialidade
        );

        // Atendimento da criança
        Atendimento atendimentoCrianca = new Atendimento(
                canal,
                LocalDate.of(2026, 2, 25),
                LocalDate.of(2026, 2, 25),
                1,
                crianca,
                1,
                "Em andamento",
                voluntario
        );

        // Atendimento da mulher
        Atendimento atendimentoMulher = new Atendimento(
                canal,
                LocalDate.of(2026, 2, 25),
                LocalDate.of(2026, 2, 25),
                2,
                mulher,
                1,
                "Aberto",
                voluntario
        );

        // Impressão
        System.out.println(atendimentoCrianca);
        System.out.println(atendimentoMulher);
    }
}