package test;

import java.sql.Connection;
import java.sql.DriverManager;

public class TesteConexao {
    public static void main(String[] args) {
        try {
            String url = System.getenv("DB_URL");
            String username = System.getenv("DB_USERNAME");
            String password = System.getenv("DB_PASSWORD");
            Connection conn = DriverManager.getConnection(url, username, password);
            System.out.println("Conectado ao Oracle!");
            conn.close();
        } catch (Exception e) {
            System.out.println("Erro: " + e.getMessage());
        }
    }
}
