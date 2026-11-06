package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {

    List<Reserva> findAllByOrderByIdReservaDesc();

    List<Reserva> findByClienteIdClienteOrderByIdReservaDesc(Integer idCliente);

    boolean existsByServicoIdServico(Integer idServico);

    boolean existsByClienteIdCliente(Integer idCliente);
}
