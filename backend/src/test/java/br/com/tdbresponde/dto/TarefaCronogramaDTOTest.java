package br.com.tdbresponde.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

public class TarefaCronogramaDTOTest {

    @Test
    public void testJsonSerializationHasSnakeCase() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        
        TarefaCronogramaDTO dto = new TarefaCronogramaDTO();
        dto.setIdVoluntario(10L);
        dto.setIdTarefa(5L);
        dto.setDiaSemana("Segunda-feira");
        
        String json = mapper.writeValueAsString(dto);
        
        assertTrue(json.contains("\"id_voluntario\":10"), "JSON deve conter id_voluntario");
        assertTrue(json.contains("\"id_tarefa\":5"), "JSON deve conter id_tarefa");
        assertTrue(json.contains("\"dia_semana\":\"Segunda-feira\""), "JSON deve conter dia_semana");
        
        assertFalse(json.contains("idVoluntario"), "JSON não deve conter idVoluntario");
        assertFalse(json.contains("diaSemana"), "JSON não deve conter diaSemana");
    }
}
