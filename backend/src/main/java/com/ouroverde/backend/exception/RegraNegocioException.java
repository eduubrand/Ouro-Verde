package com.ouroverde.backend.exception;

/** Lancada quando os dados enviados quebram alguma regra do sistema. Vira HTTP 400. */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
