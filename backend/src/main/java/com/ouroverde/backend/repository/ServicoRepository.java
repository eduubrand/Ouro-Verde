package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.Servico;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicoRepository extends JpaRepository<Servico, Integer> {
}