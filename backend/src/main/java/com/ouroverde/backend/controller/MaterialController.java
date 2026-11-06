package com.ouroverde.backend.controller;

import com.ouroverde.backend.dto.DisponibilidadeDTO;
import com.ouroverde.backend.exception.RecursoNaoEncontradoException;
import com.ouroverde.backend.exception.RegraNegocioException;
import com.ouroverde.backend.model.CategoriaMaterial;
import com.ouroverde.backend.model.Material;
import com.ouroverde.backend.repository.CategoriaMaterialRepository;
import com.ouroverde.backend.repository.MaterialRepository;
import com.ouroverde.backend.repository.ReservaMaterialRepository;
import com.ouroverde.backend.service.ReservaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/materiais")
public class MaterialController {

    private final MaterialRepository repository;
    private final CategoriaMaterialRepository categoriaRepository;
    private final ReservaMaterialRepository reservaMaterialRepository;
    private final ReservaService reservaService;

    public MaterialController(MaterialRepository repository,
                              CategoriaMaterialRepository categoriaRepository,
                              ReservaMaterialRepository reservaMaterialRepository,
                              ReservaService reservaService) {
        this.repository = repository;
        this.categoriaRepository = categoriaRepository;
        this.reservaMaterialRepository = reservaMaterialRepository;
        this.reservaService = reservaService;
    }

    @GetMapping
    public List<Material> listarCatalogo() {
        return repository.findAllByOrderByNomeAsc();
    }

    /** Ex.: GET /api/materiais/disponibilidade?data=2026-12-20 */
    @GetMapping("/disponibilidade")
    public List<DisponibilidadeDTO> disponibilidade(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return reservaService.disponibilidade(data);
    }

    @GetMapping("/{id}")
    public Material buscar(@PathVariable Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Material não encontrado: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Material cadastrarMaterial(@RequestBody Material novoMaterial) {
        novoMaterial.setIdMaterial(null);
        validarEPrepararMaterial(novoMaterial);
        return repository.save(novoMaterial);
    }

    @PutMapping("/{id}")
    public Material atualizarMaterial(@PathVariable Integer id, @RequestBody Material dados) {
        Material material = buscar(id);
        validarEPrepararMaterial(dados);

        material.setNome(dados.getNome());
        material.setQuantidadeEstoque(dados.getQuantidadeEstoque());
        material.setPrecoUnitario(dados.getPrecoUnitario());
        material.setCategoria(dados.getCategoria());
        material.setUrlImagem(dados.getUrlImagem()); // antes a imagem nunca era atualizada

        return repository.save(material);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarMaterial(@PathVariable Integer id) {
        buscar(id);
        if (reservaMaterialRepository.existsByMaterialIdMaterial(id)) {
            throw new RegraNegocioException(
                    "Este produto já aparece em reservas e não pode ser excluído. "
                            + "Para tirá-lo do catálogo, edite e coloque o estoque em 0.");
        }
        repository.deleteById(id);
    }

    private void validarEPrepararMaterial(Material m) {
        if (m.getNome() == null || m.getNome().isBlank()) throw new RegraNegocioException("Informe o nome do produto.");
        if (m.getPrecoUnitario() == null || m.getPrecoUnitario().signum() < 0) {
            throw new RegraNegocioException("Informe um preço válido (maior ou igual a zero).");
        }
        if (m.getQuantidadeEstoque() == null || m.getQuantidadeEstoque() < 0) {
            throw new RegraNegocioException("Informe um estoque válido (maior ou igual a zero).");
        }
        if (m.getCategoria() == null || m.getCategoria().getIdCategoria() == null) {
            throw new RegraNegocioException("Escolha uma categoria.");
        }
        CategoriaMaterial categoria = categoriaRepository.findById(m.getCategoria().getIdCategoria())
                .orElseThrow(() -> new RegraNegocioException("Categoria inexistente."));

        m.setNome(m.getNome().trim());
        m.setCategoria(categoria);
        if (m.getUrlImagem() != null && m.getUrlImagem().isBlank()) m.setUrlImagem(null);
    }
}
