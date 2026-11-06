package com.ouroverde.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "cliente")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Integer idCliente;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(name = "cpf_cnpj", nullable = false, unique = true, length = 20)
    private String cpfCnpj;

    @Column(length = 150)
    private String rua;

    @Column(length = 20)
    private String numero;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 20)
    private String cep;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // WRITE_ONLY: a senha pode ser recebida, mas nunca e devolvida no JSON.
    @Column(nullable = false, length = 255)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    // Atributo multivalorado do MER (um cliente pode ter varios telefones).
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<TelefoneCliente> telefones = new ArrayList<>();
}
