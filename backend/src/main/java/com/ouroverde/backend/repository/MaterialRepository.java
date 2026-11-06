package com.ouroverde.backend.repository;

import com.ouroverde.backend.model.Material;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Integer> {

    List<Material> findAllByOrderByNomeAsc();

    boolean existsByCategoriaIdCategoria(Integer idCategoria);

    /**
     * Busca o material "travando" a linha no banco ate o fim da transacao.
     * Evita que duas reservas feitas ao mesmo tempo aluguem a mesma unidade.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Material m where m.idMaterial = :id")
    Optional<Material> buscarComBloqueio(@Param("id") Integer id);
}
