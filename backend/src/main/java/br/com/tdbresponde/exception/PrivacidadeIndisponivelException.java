package br.com.tdbresponde.exception;

public class PrivacidadeIndisponivelException extends RuntimeException {
    public PrivacidadeIndisponivelException() {
        super("O cadastro e o acesso por usuário estão temporariamente indisponíveis. Se já possui uma conta com e-mail, entre usando seu e-mail.");
    }
}
