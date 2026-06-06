package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.PessoaAtendidaBase;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class AtendimentoResponseIaTest {

    @Test
    void deveMapearCriancaAdolescenteCorretamente() {
        // Arrange
        CriancaAdolescente crianca = new CriancaAdolescente();
        crianca.setId(1);
        crianca.setNomeCodificado("Menino Sol");
        crianca.setGravidadeBucal(4);

        Atendimento atendimento = new Atendimento();
        atendimento.setId(10);
        atendimento.setPessoaAtendida(crianca);
        atendimento.setDescricao("Necessita tratamento dentario urgente");

        // Act
        AtendimentoResponse response = AtendimentoResponse.from(atendimento);

        // Assert
        assertNotNull(response);
        assertEquals("CRIANCA_ADOLESCENTE", response.tipoPessoa);
        assertEquals(4, response.gravidade);
    }

    @Test
    void deveMapearMulherApoloniaCorretamente() {
        // Arrange
        MulherApolonia mulher = new MulherApolonia();
        mulher.setId(2);
        mulher.setNomeCodificado("Maria Silva");
        mulher.setNivelRisco(5);

        Atendimento atendimento = new Atendimento();
        atendimento.setId(20);
        atendimento.setPessoaAtendida(mulher);
        atendimento.setDescricao("Caso grave de violencia doméstica");

        // Act
        AtendimentoResponse response = AtendimentoResponse.from(atendimento);

        // Assert
        assertNotNull(response);
        assertEquals("MULHER_APOLONIA", response.tipoPessoa);
        assertEquals(5, response.gravidade);
    }

    @Test
    void deveMapearOutroCorretamente() {
        // Arrange
        PessoaAtendidaBase outra = new PessoaAtendidaBase();
        outra.setId(3);
        outra.setNomeCodificado("Apoiador");

        Atendimento atendimento = new Atendimento();
        atendimento.setId(30);
        atendimento.setPessoaAtendida(outra);
        atendimento.setDescricao("Solicita informacao geral");

        // Act
        AtendimentoResponse response = AtendimentoResponse.from(atendimento);

        // Assert
        assertNotNull(response);
        assertEquals("OUTRO", response.tipoPessoa);
        assertEquals(3, response.gravidade);
    }

    @Test
    void deveMapearSemPessoaAtendidaCorretamente() {
        // Arrange
        Atendimento atendimento = new Atendimento();
        atendimento.setId(40);
        atendimento.setDescricao("Sem solicitante vinculado");

        // Act
        AtendimentoResponse response = AtendimentoResponse.from(atendimento);

        // Assert
        assertNotNull(response);
        assertNull(response.tipoPessoa);
        assertNull(response.gravidade);
    }
}
