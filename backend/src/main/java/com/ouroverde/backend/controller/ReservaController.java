package com.ouroverde.backend.controller;

import com.ouroverde.backend.dto.ReservaRequestDTO;
import com.ouroverde.backend.model.Reserva;
import com.ouroverde.backend.service.ReservaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService service;

    public ReservaController(ReservaService service) {
        this.service = service;
    }

    /** Cria a reserva e devolve ela completa (com itens e parcelas) em JSON. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Reserva criarReserva(@RequestBody ReservaRequestDTO dto) {
        return service.criar(dto);
    }

    @GetMapping
    public List<Reserva> listarTodas() {
        return service.listarTodas();
    }

    /** "Meus Pedidos": apenas as reservas de um cliente. */
    @GetMapping("/cliente/{idCliente}")
    public List<Reserva> listarPorCliente(@PathVariable Integer idCliente) {
        return service.listarPorCliente(idCliente);
    }

    @GetMapping("/{id}")
    public Reserva buscarPorId(@PathVariable Integer id) {
        return service.buscar(id);
    }

    /** Ex.: PATCH /api/reservas/5/status?novoStatus=CONFIRMADO */
    @PatchMapping("/{id}/status")
    public Reserva atualizarStatus(@PathVariable Integer id, @RequestParam String novoStatus) {
        return service.atualizarStatus(id, novoStatus);
    }

    @PatchMapping("/{idReserva}/parcelas/{numeroParcela}/pagar")
    public Reserva pagarParcela(@PathVariable Integer idReserva, @PathVariable Integer numeroParcela) {
        return service.pagarParcela(idReserva, numeroParcela);
    }
}
