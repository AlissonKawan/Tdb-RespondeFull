package br.com.tdbresponde.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException() {
        super("Voce nao tem permissao para acessar ou alterar este recurso.");
    }
}
