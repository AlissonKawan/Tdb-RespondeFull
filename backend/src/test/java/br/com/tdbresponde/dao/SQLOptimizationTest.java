package br.com.tdbresponde.dao;

import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Classe de teste para validar a regra arquitetural de otimização de consultas SQL.
 * Garante que nenhum arquivo DAO utilize consultas genéricas com asterisco (SELECT * ou SELECT alias.*).
 */
public class SQLOptimizationTest {

    @Test
    public void testNoWildcardSelectsInDAOs() throws IOException {
        // Tenta localizar a pasta do código-fonte dos DAOs em relação à pasta de execução
        File daoDir = new File("src/main/java/br/com/tdbresponde/dao");
        if (!daoDir.exists()) {
            daoDir = new File("backend/src/main/java/br/com/tdbresponde/dao");
        }

        // Garante que a pasta existe para a execução do teste
        if (!daoDir.exists()) {
            System.out.println("Diretório de DAOs não localizado na execução do teste: " + daoDir.getAbsolutePath());
            return;
        }

        File[] files = daoDir.listFiles((dir, name) -> name.endsWith(".java"));
        if (files == null || files.length == 0) {
            return;
        }

        // Padrão regex para identificar "SELECT *" ou "SELECT alias.*" contidos dentro de literais de String Java
        Pattern wildcardPattern = Pattern.compile("\"[^\"]*SELECT\\s+([A-Za-z0-9_]+\\s*\\.)?\\*[^\"]*\"", Pattern.CASE_INSENSITIVE);

        for (File file : files) {
            String content = Files.readString(file.toPath());
            Matcher matcher = wildcardPattern.matcher(content);
            
            boolean hasWildcardSelect = matcher.find();
            
            assertFalse(hasWildcardSelect, 
                "O arquivo " + file.getName() + " possui consulta SQL com SELECT * ou SELECT alias.*: " + 
                (hasWildcardSelect ? matcher.group() : "") + ". " +
                "As conexões ao banco devem ser diretas, projetando apenas as colunas solicitadas.");
        }
    }
}
