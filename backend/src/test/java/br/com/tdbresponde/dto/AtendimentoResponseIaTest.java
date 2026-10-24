package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.PessoaAtendidaBase;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
        assertNull(response.gravidade);
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

    @Test
    void devePreencherResumoFilaParaCriancaAdolescente() {
        CriancaAdolescente crianca = new CriancaAdolescente();
        crianca.setId(15);
        crianca.setNomeCodificado("Joãozinho da Silva");
        crianca.setGravidadeBucal(4);

        Atendimento atendimento = new Atendimento();
        atendimento.setId(101);
        atendimento.setStatus("ABERTO");
        atendimento.setPrioridade(2);
        atendimento.setDescricao("Precisa de canal com urgência");
        atendimento.setPessoaAtendida(crianca);
        atendimento.setDataAbertura(java.time.LocalDate.now());

        AtendimentoResponse response = AtendimentoResponse.resumoFila(atendimento);

        assertNotNull(response);
        assertEquals(101, response.id);
        assertEquals("ABERTO", response.status);
        assertEquals(2, response.prioridade);
        assertEquals("CRIANCA_ADOLESCENTE", response.tipoPessoa);
        assertEquals("Joãozinho da Silva", response.pessoaAtendidaNome);
        assertEquals("Precisa de canal com urgência", response.descricao);
        assertEquals(15, response.pessoaAtendidaId);
        assertEquals(15, response.beneficiarioId);
        assertEquals(4, response.gravidade);
    }

    @Test
    void devePreencherResumoFilaParaPessoaAtendidaBaseCrianca() {
        PessoaAtendidaBase base = new PessoaAtendidaBase();
        base.setId(22);
        base.setNomeCodificado("Adolescente Pedro");
        base.setTipo("CRIANCA_ADOLESCENTE");

        Atendimento atendimento = new Atendimento();
        atendimento.setId(102);
        atendimento.setStatus("ABERTO");
        atendimento.setPrioridade(3);
        atendimento.setDescricao("Dente quebrado jogando bola");
        atendimento.setPessoaAtendida(base);
        atendimento.setDataAbertura(java.time.LocalDate.now());

        AtendimentoResponse response = AtendimentoResponse.resumoFila(atendimento);

        assertNotNull(response);
        assertEquals(102, response.id);
        assertEquals("ABERTO", response.status);
        assertEquals("CRIANCA_ADOLESCENTE", response.tipoPessoa);
        assertEquals("Adolescente Pedro", response.pessoaAtendidaNome);
        assertEquals("Dente quebrado jogando bola", response.descricao);
        assertEquals(22, response.pessoaAtendidaId);
    }

    @Test
    void devePreencherResumoFilaParaMulherApoloniaPreservandoSigilo() {
        MulherApolonia mulher = new MulherApolonia();
        mulher.setId(33);
        mulher.setNomeCodificado("Maria Verdadeira");
        mulher.setCodinome("Rosa dos Ventos");
        mulher.setNecessitaSigiloAbsoluto(true);

        Atendimento atendimento = new Atendimento();
        atendimento.setId(103);
        atendimento.setStatus("ABERTO");
        atendimento.setPrioridade(1);
        atendimento.setDescricao("Relato sigiloso de acolhimento");
        atendimento.setPessoaAtendida(mulher);
        atendimento.setDataAbertura(java.time.LocalDate.now());

        AtendimentoResponse response = AtendimentoResponse.resumoFila(atendimento);

        assertNotNull(response);
        assertEquals(103, response.id);
        assertEquals("ABERTO", response.status);
        assertEquals("MULHER_APOLONIA", response.tipoPessoa);
        assertEquals("Rosa dos Ventos", response.pessoaAtendidaNome);
        assertEquals("Rosa dos Ventos", response.codinome);
        assertEquals("Relato sigiloso de acolhimento", response.descricao);
        assertTrue(response.necessitaSigiloAbsoluto);
        assertNull(response.pessoaAtendidaId);
    }
}
