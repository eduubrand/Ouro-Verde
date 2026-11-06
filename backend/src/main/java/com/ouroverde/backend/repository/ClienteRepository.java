package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    // O Spring gera o SQL sozinho a partir do nome do metodo.
    Optional<Cliente> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByCpfCnpj(String cpfCnpj);
}
