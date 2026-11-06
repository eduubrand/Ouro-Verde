package com.ouroverde.backend.controller;

import com.ouroverde.backend.dto.LoginRequestDTO;
import com.ouroverde.backend.exception.CredenciaisInvalidasException;
import com.ouroverde.backend.exception.RecursoNaoEncontradoException;
import com.ouroverde.backend.exception.RegraNegocioException;
import com.ouroverde.backend.model.Administrador;
import com.ouroverde.backend.repository.AdministradorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/administradores")
public class AdministradorController {

    private final AdministradorRepository repository;

    public AdministradorController(AdministradorRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Administrador> listarAdministradores() {
        return repository.findAll();
    }

    /** UC01 - Efetuar Login (administrador) */
    @PostMapping("/login")
    public Administrador login(@RequestBody LoginRequestDTO dto) {
        if (dto.getEmail() == null) throw new CredenciaisInvalidasException();
        return repository.findByEmail(dto.getEmail().trim().toLowerCase())
                .filter(admin -> Objects.equals(admin.getSenha(), dto.getSenha()))
                .orElseThrow(CredenciaisInvalidasException::new);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Administrador cadastrarAdministrador(@RequestBody Administrador novoAdmin) {
        if (novoAdmin.getEmail() == null || novoAdmin.getSenha() == null || novoAdmin.getNome() == null) {
            throw new RegraNegocioException("Informe nome, e-mail e senha.");
        }
        novoAdmin.setIdAdmin(null);
        novoAdmin.setEmail(novoAdmin.getEmail().trim().toLowerCase());
        return repository.save(novoAdmin);
    }

    @PutMapping("/{id}")
    public Administrador atualizarAdministrador(@PathVariable Integer id, @RequestBody Administrador dados) {
        Administrador admin = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Administrador não encontrado: " + id));

        if (dados.getNome() != null) admin.setNome(dados.getNome());
        if (dados.getEmail() != null) admin.setEmail(dados.getEmail().trim().toLowerCase());
        // So troca a senha se uma nova foi enviada (antes, editar sem senha apagava a senha).
        if (dados.getSenha() != null && !dados.getSenha().isBlank()) admin.setSenha(dados.getSenha());

        return repository.save(admin);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarAdministrador(@PathVariable Integer id) {
        repository.deleteById(id);
    }
}
