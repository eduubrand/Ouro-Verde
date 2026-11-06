package com.ouroverde.backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * JSON esperado em POST /api/reservas:
 * {
 *   "idCliente": 1,
 *   "idServico": 1,
 *   "dataEvento": "2026-12-20",
 *   "tipoEntrega": "ENTREGA",          (ou "RETIRADA")
 *   "formaPagamento": "PIX",           (ou "PRESENCIAL")
 *   "quantidadeParcelas": 2,
 *   "itens": [ { "idMaterial": 2, "quantidadeAlocada": 10 } ]
 * }
 */
@Data
public class ReservaRequestDTO {
    private Integer idCliente;
    private Integer idServico;
    private LocalDate dataEvento;
    private LocalDateTime dataHoraEvento;
    private String tipoEntrega;
    private String formaPagamento;
    private Integer quantidadeParcelas;
    private List<ItemReservaDTO> itens;
}
