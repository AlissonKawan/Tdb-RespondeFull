package test;

import connection.ConnectionFactory;
import java.sql.Connection;

public class TesteConexao {
    public static void main(String[] args) {
        try {
            Connection conn = ConnectionFactory.getConnection();
            System.out.println("Conectado ao Oracle!");
            conn.close();
        } catch (Exception e) {
            System.out.println("Erro: " + e.getMessage());
        }
    }
}