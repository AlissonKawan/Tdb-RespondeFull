package br.com.tdbresponde.model;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class VoluntarioTest {

    @Test
    void deveManterEspecialidadeLegadaSincronizadaComALista() {
        Voluntario voluntario = new Voluntario();
        Especialidade psicologia = especialidade(1, "Psicologia");
        Especialidade juridico = especialidade(2, "Juridico");

        voluntario.setEspecialidades(List.of(psicologia, juridico));

        assertSame(psicologia, voluntario.getEspecialidade());
        assertEquals(2, voluntario.getEspecialidades().size());
    }

    @Test
    void deveAdicionarEspecialidadeLegadaNaListaSemDuplicar() {
        Voluntario voluntario = new Voluntario();
        Especialidade psicologia = especialidade(1, "Psicologia");

        voluntario.setEspecialidade(psicologia);
        voluntario.setEspecialidade(psicologia);

        assertSame(psicologia, voluntario.getEspecialidade());
        assertEquals(1, voluntario.getEspecialidades().size());
    }

    @Test
    void deveTratarListaNulaComoListaVazia() {
        Voluntario voluntario = new Voluntario();

        voluntario.setEspecialidades(null);

        assertNull(voluntario.getEspecialidade());
        assertEquals(0, voluntario.getEspecialidades().size());
    }

    private Especialidade especialidade(int id, String nome) {
        Especialidade especialidade = new Especialidade();
        especialidade.setId(id);
        especialidade.setNome(nome);
        return especialidade;
    }
}
