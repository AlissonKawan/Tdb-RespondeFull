package br.com.tdbresponde.bo;

import br.com.tdbresponde.client.MockCroVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class MockCroVerificationServiceTest {

    private MockCroVerificationService service;

    @BeforeEach
    void setUp() {
        service = new MockCroVerificationService();
    }

    @Test
    void deveAprovarCroValido() {
        assertTrue(service.verificar("12345", "SP"));
        assertTrue(service.verificar("54321", "RJ"));
    }

    @Test
    void deveRejeitarCro000000() {
        assertFalse(service.verificar("000000", "SP"));
    }

    @Test
    void deveRejeitarCroInvalidoPorTexto() {
        assertFalse(service.verificar("INVALIDO", "SP"));
        assertFalse(service.verificar("invalido", "SP"));
    }

    @Test
    void deveRejeitarQuandoCroForNuloOuVazio() {
        assertFalse(service.verificar(null, "SP"));
        assertFalse(service.verificar("   ", "SP"));
    }

    @Test
    void deveRejeitarQuandoUfForNulaOuVazia() {
        assertFalse(service.verificar("12345", null));
        assertFalse(service.verificar("12345", "   "));
    }

    @Test
    void deveRejeitarQuandoUfNaoTiverDoisCaracteres() {
        assertFalse(service.verificar("12345", "S"));
        assertFalse(service.verificar("12345", "SPO"));
    }
}
