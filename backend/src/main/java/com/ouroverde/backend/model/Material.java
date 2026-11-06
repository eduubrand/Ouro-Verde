package com.ouroverde.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "material")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_material")
    private Integer idMaterial;

    @Column(nullable = false, length = 100)
    private String nome;

    /** Quantidade total que a empresa possui (nao diminui ao alugar). */
    @Column(name = "quantidade_estoque", nullable = false)
    private Integer quantidadeEstoque;

    @Column(name = "preco_unitario", nullable = false)
    private BigDecimal precoUnitario;

    @ManyToOne
    @JoinColumn(name = "id_categoria", nullable = false)
    private CategoriaMaterial categoria;

    @Column(name = "url_imagem", length = 255)
    private String urlImagem;
}
