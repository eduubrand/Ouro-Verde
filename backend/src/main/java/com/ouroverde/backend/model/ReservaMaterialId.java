package com.ouroverde.backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import java.io.Serializable;

@Data
@Embeddable
public class ReservaMaterialId implements Serializable {

    private Integer idReserva;
    private Integer idMaterial;
}