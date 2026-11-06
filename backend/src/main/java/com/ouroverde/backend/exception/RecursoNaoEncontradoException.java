package com.ouroverde.backend.exception;

/** Lancada quando um ID nao existe no banco. Vira HTTP 404. */
public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
