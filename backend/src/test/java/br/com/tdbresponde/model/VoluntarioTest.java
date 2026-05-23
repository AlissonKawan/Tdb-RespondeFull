package br.com.tdbresponde.model;

import br.com.tdbresponde.dto.VoluntarioResponse;
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

    @Test
    void deveSalvarERecuperarCamposDeIndicacao() {
        Voluntario voluntario = new Voluntario();
        voluntario.setId(1);
        voluntario.setNome("Voluntario Teste");
        voluntario.setCodigoIndicacao("IND123");
        voluntario.setPontosIndicacao(50);
        voluntario.setIdVoluntarioIndicador(2);

        assertEquals("IND123", voluntario.getCodigoIndicacao());
        assertEquals(50, voluntario.getPontosIndicacao());
        assertEquals(2, voluntario.getIdVoluntarioIndicador());
    }

    @Test
    void deveMapearCamposDeIndicacaoNoDTO() {
        Voluntario voluntario = new Voluntario();
        voluntario.setId(1);
        voluntario.setNome("Voluntario Teste");
        voluntario.setCodigoIndicacao("IND456");
        voluntario.setPontosIndicacao(100);
        voluntario.setIdVoluntarioIndicador(3);

        VoluntarioResponse response = VoluntarioResponse.from(voluntario);

        assertEquals("IND456", response.codigoIndicacao);
        assertEquals(100, response.pontosIndicacao);
        assertEquals(3, response.idVoluntarioIndicador);
    }

    private Especialidade especialidade(int id, String nome) {
        Especialidade especialidade = new Especialidade();
        especialidade.setId(id);
        especialidade.setNome(nome);
        return especialidade;
    }
}
