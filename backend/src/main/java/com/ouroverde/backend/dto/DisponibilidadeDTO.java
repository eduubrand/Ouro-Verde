package com.ouroverde.backend.dto;

/** Quantas unidades de um material estao livres em uma data. */
public record DisponibilidadeDTO(Integer idMaterial, Integer estoqueTotal, Integer reservado, Integer disponivel) {
}
