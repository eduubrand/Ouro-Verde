package com.ouroverde.backend.controller;

import com.ouroverde.backend.exception.RecursoNaoEncontradoException;
import com.ouroverde.backend.exception.RegraNegocioException;
import com.ouroverde.backend.model.Servico;
import com.ouroverde.backend.repository.ReservaRepository;
import com.ouroverde.backend.repository.ServicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final ServicoRepository repository;
    private final ReservaRepository reservaRepository;

    public ServicoController(ServicoRepository repository, ReservaRepository reservaRepository) {
        this.repository = repository;
        this.reservaRepository = reservaRepository;
    }

    @GetMapping
    public List<Servico> listarServicos() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Servico buscar(@PathVariable Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Servico cadastrarServico(@RequestBody Servico novoServico) {
        validar(novoServico);
        novoServico.setIdServico(null);
        return repository.save(novoServico);
    }

    @PutMapping("/{id}")
    public Servico atualizarServico(@PathVariable Integer id, @RequestBody Servico dados) {
        validar(dados);
        Servico servico = buscar(id);
        servico.setNome(dados.getNome());
        servico.setDescricao(dados.getDescricao());
        servico.setPrecoBase(dados.getPrecoBase());
        servico.setUrlImagem(dados.getUrlImagem());
        return repository.save(servico);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarServico(@PathVariable Integer id) {
        buscar(id);
        if (reservaRepository.existsByServicoIdServico(id)) {
            throw new RegraNegocioException("Este serviço já foi usado em reservas e não pode ser excluído.");
        }
        repository.deleteById(id);
    }

    private void validar(Servico s) {
        if (s.getNome() == null || s.getNome().isBlank()) throw new RegraNegocioException("Informe o nome do serviço.");
        if (s.getPrecoBase() == null || s.getPrecoBase().signum() < 0) {
            throw new RegraNegocioException("Informe um preço base válido.");
        }
    }
}
