package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.Administrador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdministradorRepository extends JpaRepository<Administrador, Integer> {
    Optional<Administrador> findByEmail(String email);
}
