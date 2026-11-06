package com.ouroverde.backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import java.io.Serializable;

@Data
@Embeddable
public class ParcelaId implements Serializable {

    private Integer idReserva;
    private Integer numeroParcela;

}