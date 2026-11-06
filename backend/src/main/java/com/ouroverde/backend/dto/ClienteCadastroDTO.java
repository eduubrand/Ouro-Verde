package com.ouroverde.backend.dto;

import lombok.Data;

/** Dados recebidos na tela de cadastro do cliente (POST /api/clientes). */
@Data
public class ClienteCadastroDTO {
    private String nome;
    private String cpfCnpj;
    private String email;
    private String senha;
    private String telefone;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String cep;
}
