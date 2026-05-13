package br.com.tdbresponde.security;

import br.com.tdbresponde.exception.BusinessException;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public final class SenhaHasher {

    private static final String ALGORITMO = "PBKDF2WithHmacSHA256";
    private static final int ITERACOES = 120_000;
    private static final int TAMANHO_CHAVE = 256;
    private static final int TAMANHO_SALT = 16;
    private static final SecureRandom RANDOM = new SecureRandom();

    private SenhaHasher() {
    }

    public static String gerarHash(String senha) {
        byte[] salt = new byte[TAMANHO_SALT];
        RANDOM.nextBytes(salt);
        byte[] hash = gerarHash(senha.toCharArray(), salt, ITERACOES, TAMANHO_CHAVE);
        return "PBKDF2$" + ITERACOES + "$" +
                Base64.getEncoder().encodeToString(salt) + "$" +
                Base64.getEncoder().encodeToString(hash);
    }

    public static boolean validarSenha(String senha, String senhaHash) {
        if (senha == null || senhaHash == null || !senhaHash.startsWith("PBKDF2$")) {
            return false;
        }

        String[] partes = senhaHash.split("\\$");
        if (partes.length != 4) {
            return false;
        }

        try {
            int iteracoes = Integer.parseInt(partes[1]);
            byte[] salt = Base64.getDecoder().decode(partes[2]);
            byte[] hashArmazenado = Base64.getDecoder().decode(partes[3]);
            byte[] hashInformado = gerarHash(senha.toCharArray(), salt, iteracoes, hashArmazenado.length * 8);
            return MessageDigest.isEqual(hashArmazenado, hashInformado);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static byte[] gerarHash(char[] senha, byte[] salt, int iteracoes, int tamanhoChave) {
        try {
            PBEKeySpec spec = new PBEKeySpec(senha, salt, iteracoes, tamanhoChave);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITMO);
            return factory.generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new BusinessException("Erro ao gerar hash da senha");
        }
    }
}
