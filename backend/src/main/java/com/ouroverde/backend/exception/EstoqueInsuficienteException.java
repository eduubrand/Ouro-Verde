package com.ouroverde.backend.exception;

/** Lancada quando nao ha unidades disponiveis na data pedida. Vira HTTP 422. */
public class EstoqueInsuficienteException extends RuntimeException {
    public EstoqueInsuficienteException(String mensagem) {
        super(mensagem);
    }
}
