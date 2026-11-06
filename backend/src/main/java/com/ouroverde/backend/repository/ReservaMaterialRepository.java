package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.ReservaMaterial;
import com.ouroverde.backend.model.ReservaMaterialId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface ReservaMaterialRepository extends JpaRepository<ReservaMaterial, ReservaMaterialId> {

    /**
     * Quantas unidades de um material ja estao comprometidas em reservas
     * NAO canceladas para a data informada.
     * Usado no caso de uso "Verificar Disponibilidade".
     */
    @Query("""
            select coalesce(sum(rm.quantidadeAlocada), 0)
            from ReservaMaterial rm
            where rm.material.idMaterial = :idMaterial
              and rm.reserva.dataEvento = :data
              and rm.reserva.status <> 'CANCELADO'
            """)
    long somarReservadoNaData(@Param("idMaterial") Integer idMaterial, @Param("data") LocalDate data);

    boolean existsByMaterialIdMaterial(Integer idMaterial);
}
