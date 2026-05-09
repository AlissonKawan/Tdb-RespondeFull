package test;

import model.CanalComunicacao;

public class TesteCanal {
    public static void main(String[] args) {

        CanalComunicacao canal = new CanalComunicacao(1, "Zap", "Dor no dente");
        System.out.println(canal.toString());
    }
}
