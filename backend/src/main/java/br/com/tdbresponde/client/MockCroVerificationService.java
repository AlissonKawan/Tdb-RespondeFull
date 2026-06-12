package br.com.tdbresponde.client;

public class MockCroVerificationService implements CroVerificationService {

    @Override
    public boolean verificar(String cro, String uf) {
        if (cro == null || cro.trim().isEmpty() || uf == null || uf.trim().isEmpty()) {
            return false;
        }

        String croLimpo = cro.trim();
        String ufLimpa = uf.trim().toUpperCase();

        if ("000000".equals(croLimpo) || "INVALIDO".equalsIgnoreCase(croLimpo)) {
            return false;
        }

        if (ufLimpa.length() != 2) {
            return false;
        }

        return true;
    }
}
