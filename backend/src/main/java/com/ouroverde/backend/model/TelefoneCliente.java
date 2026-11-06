package com.ouroverde.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Data
@Entity
@Table(name = "telefone_cliente")
public class TelefoneCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_telefone")
    private Integer idTelefone;

    @Column(nullable = false, length = 20)
    private String numero;

    @ManyToOne
    @JoinColumn(name = "id_cliente", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Cliente cliente;
}
