package com.ouroverde.backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "reserva")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva")
    private Integer idReserva;

    @ManyToOne
    @JoinColumn(name = "id_cliente", nullable = false)
    @JsonIgnoreProperties("telefones")
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "id_servico", nullable = false)
    private Servico servico;

    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate dataSolicitacao;

    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate dataEvento;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm")
    private LocalDateTime dataHoraEvento;

    /** PENDENTE, CONFIRMADO, EM_ANDAMENTO, CONCLUIDO ou CANCELADO */
    @Column(nullable = false, length = 50)
    private String status;

    /** ENTREGA ou RETIRADA */
    @Column(name = "tipo_entrega", nullable = false, length = 20)
    private String tipoEntrega;

    /** PIX ou PRESENCIAL */
    @Column(name = "forma_pagamento", nullable = false, length = 20)
    private String formaPagamento;

    @Column(name = "valor_total")
    private BigDecimal valorTotal;

    // Itens e parcelas vem junto no JSON da reserva (usados em "Meus Pedidos" e no painel admin).
    // @ToString/@EqualsAndHashCode.Exclude evitam loop infinito (Reserva -> Item -> Reserva -> ...).
    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id.idMaterial")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ReservaMaterial> itens = new ArrayList<>();

    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id.numeroParcela")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Parcela> parcelas = new ArrayList<>();
}
