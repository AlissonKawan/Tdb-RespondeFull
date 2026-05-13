package test;

import br.com.tdbresponde.dao.CanalComunicacaoDAO;
import br.com.tdbresponde.model.CanalComunicacao;

public class TesteCanalDAO {
    public static void main(String[] args) {
        CanalComunicacaoDAO dao = new CanalComunicacaoDAO();

        // CREATE
        CanalComunicacao canal = new CanalComunicacao();
        canal.setNome("WhatsApp");
        canal.setDescricao("Mensagens instantâneas");
        dao.inserir(canal);
        System.out.println("Inserido!");

        // READ todos
        System.out.println("Lista de canais:");
        for (CanalComunicacao c : dao.buscarTodos()) {
            System.out.println(c);
        }
    }
}