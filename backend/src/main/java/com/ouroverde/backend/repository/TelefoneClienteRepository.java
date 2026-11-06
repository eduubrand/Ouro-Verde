package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.TelefoneCliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelefoneClienteRepository extends JpaRepository<TelefoneCliente, Integer> {
}