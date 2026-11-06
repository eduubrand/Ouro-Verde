package com.ouroverde.backend.exception;

/** Lancada quando e-mail ou senha nao conferem. Vira HTTP 401. */
public class CredenciaisInvalidasException extends RuntimeException {
    public CredenciaisInvalidasException() {
        super("E-mail ou senha incorretos.");
    }
}
