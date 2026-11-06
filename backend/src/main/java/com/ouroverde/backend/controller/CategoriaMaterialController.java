package com.ouroverde.backend.controller;

import com.ouroverde.backend.exception.RecursoNaoEncontradoException;
import com.ouroverde.backend.exception.RegraNegocioException;
import com.ouroverde.backend.model.CategoriaMaterial;
import com.ouroverde.backend.repository.CategoriaMaterialRepository;
import com.ouroverde.backend.repository.MaterialRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** UC07 - Gerenciar Categorias */
@RestController
@RequestMapping("/api/categorias")
public class CategoriaMaterialController {

    private final CategoriaMaterialRepository repository;
    private final MaterialRepository materialRepository;

    public CategoriaMaterialController(CategoriaMaterialRepository repository, MaterialRepository materialRepository) {
        this.repository = repository;
        this.materialRepository = materialRepository;
    }

    @GetMapping
    public List<CategoriaMaterial> listarCategorias() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaMaterial cadastrarCategoria(@RequestBody CategoriaMaterial nova) {
        validar(nova);
        nova.setIdCategoria(null);
        nova.setNome(nova.getNome().trim());
        return repository.save(nova);
    }

    @PutMapping("/{id}")
    public CategoriaMaterial atualizarCategoria(@PathVariable Integer id, @RequestBody CategoriaMaterial dados) {
        validar(dados);
        CategoriaMaterial categoria = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada: " + id));
        categoria.setNome(dados.getNome().trim());
        return repository.save(categoria);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarCategoria(@PathVariable Integer id) {
        if (materialRepository.existsByCategoriaIdCategoria(id)) {
            throw new RegraNegocioException("Existem produtos nesta categoria. Mova-os para outra categoria antes de excluir.");
        }
        repository.deleteById(id);
    }

    private void validar(CategoriaMaterial c) {
        if (c.getNome() == null || c.getNome().isBlank()) throw new RegraNegocioException("Informe o nome da categoria.");
    }
}
