package com.ouroverde.backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "parcela")
public class Parcela {

    @EmbeddedId
    private ParcelaId id = new ParcelaId();

    @ManyToOne
    @MapsId("idReserva")
    @JoinColumn(name = "id_reserva")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Reserva reserva;

    @JsonFormat(pattern = "dd/MM/yyyy")
    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Column(name = "valor_parcela", nullable = false)
    private BigDecimal valorParcela;

    /** PENDENTE ou PAGO */
    @Column(name = "status_pagamento", nullable = false, length = 50)
    private String statusPagamento;

    @JsonFormat(pattern = "dd/MM/yyyy")
    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;
}
