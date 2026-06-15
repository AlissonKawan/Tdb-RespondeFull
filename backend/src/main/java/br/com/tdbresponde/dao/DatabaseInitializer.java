package br.com.tdbresponde.dao;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@ApplicationScoped
public class DatabaseInitializer {
    
    @Inject
    DataSource dataSource;

    void onStart(@Observes StartupEvent ev) {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            String createTable = "CREATE TABLE AGENDA_CONSULTA (" +
                "ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, " +
                "VOLUNTARIO_ID NUMBER NOT NULL, " +
                "PACIENTE VARCHAR2(255) NOT NULL, " +
                "TIPO VARCHAR2(100) NOT NULL, " +
                "DATA_CONSULTA DATE NOT NULL, " +
                "HORARIO VARCHAR2(10) NOT NULL, " +
                "STATUS VARCHAR2(50) NOT NULL, " +
                "TIPO_PESSOA VARCHAR2(50) " +
                ")";
            stmt.execute(createTable);
            System.out.println("Tabela AGENDA_CONSULTA criada.");
        } catch (Exception e) {
            System.out.println("Tabela AGENDA_CONSULTA já existe.");
        }

        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE INDEX IDX_AGENDA_VOL ON AGENDA_CONSULTA(VOLUNTARIO_ID)");
            System.out.println("Indice IDX_AGENDA_VOL criado.");
        } catch (Exception e) {}

        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE INDEX IDX_AGENDA_DATA ON AGENDA_CONSULTA(DATA_CONSULTA)");
            System.out.println("Indice IDX_AGENDA_DATA criado.");
        } catch (Exception e) {}
    }
}
