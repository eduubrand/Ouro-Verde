package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.Parcela;
import com.ouroverde.backend.model.ParcelaId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParcelaRepository extends JpaRepository<Parcela, ParcelaId> {
}