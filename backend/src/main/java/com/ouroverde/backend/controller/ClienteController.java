package com.ouroverde.backend.controller;

import com.ouroverde.backend.dto.ClienteCadastroDTO;
import com.ouroverde.backend.dto.LoginRequestDTO;
import com.ouroverde.backend.exception.CredenciaisInvalidasException;
import com.ouroverde.backend.exception.RecursoNaoEncontradoException;
import com.ouroverde.backend.exception.RegraNegocioException;
import com.ouroverde.backend.model.Cliente;
import com.ouroverde.backend.model.TelefoneCliente;
import com.ouroverde.backend.repository.ClienteRepository;
import com.ouroverde.backend.repository.ReservaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteRepository repository;
    private final ReservaRepository reservaRepository;

    public ClienteController(ClienteRepository repository, ReservaRepository reservaRepository) {
        this.repository = repository;
        this.reservaRepository = reservaRepository;
    }

    @GetMapping
    public List<Cliente> listarClientes() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Cliente buscar(@PathVariable Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado: " + id));
    }

    /** UC02 - Cadastrar Cliente */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Cliente cadastrarCliente(@RequestBody ClienteCadastroDTO dto) {
        exigir(dto.getNome(), "Informe o nome.");
        exigir(dto.getCpfCnpj(), "Informe o CPF ou CNPJ.");
        exigir(dto.getEmail(), "Informe o e-mail.");
        if (!dto.getEmail().contains("@")) throw new RegraNegocioException("E-mail inválido.");
        if (dto.getSenha() == null || dto.getSenha().length() < 6) {
            throw new RegraNegocioException("A senha deve ter pelo menos 6 caracteres.");
        }
        if (repository.existsByEmailIgnoreCase(dto.getEmail().trim())) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail.");
        }
        if (repository.existsByCpfCnpj(dto.getCpfCnpj().trim())) {
            throw new RegraNegocioException("Já existe uma conta com este CPF/CNPJ.");
        }

        Cliente cliente = new Cliente();
        cliente.setNome(dto.getNome().trim());
        cliente.setCpfCnpj(dto.getCpfCnpj().trim());
        cliente.setEmail(dto.getEmail().trim().toLowerCase());
        cliente.setSenha(dto.getSenha());
        cliente.setRua(dto.getRua());
        cliente.setNumero(dto.getNumero());
        cliente.setBairro(dto.getBairro());
        cliente.setCidade(dto.getCidade());
        cliente.setCep(dto.getCep());

        if (dto.getTelefone() != null && !dto.getTelefone().isBlank()) {
            TelefoneCliente telefone = new TelefoneCliente();
            telefone.setNumero(dto.getTelefone().trim());
            telefone.setCliente(cliente); // sem isso o banco recusa (id_cliente NOT NULL)
            cliente.getTelefones().add(telefone);
        }

        return repository.save(cliente);
    }

    /** UC01 - Efetuar Login (cliente) */
    @PostMapping("/login")
    public Cliente login(@RequestBody LoginRequestDTO dto) {
        if (dto.getEmail() == null) throw new CredenciaisInvalidasException();
        return repository.findByEmailIgnoreCase(dto.getEmail().trim())
                .filter(c -> Objects.equals(c.getSenha(), dto.getSenha()))
                .orElseThrow(CredenciaisInvalidasException::new);
    }

    @PutMapping("/{id}")
    public Cliente atualizarCliente(@PathVariable Integer id, @RequestBody Cliente dados) {
        Cliente cliente = buscar(id);

        if (dados.getEmail() != null && !dados.getEmail().equalsIgnoreCase(cliente.getEmail())
                && repository.existsByEmailIgnoreCase(dados.getEmail())) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail.");
        }

        if (dados.getNome() != null) cliente.setNome(dados.getNome());
        if (dados.getCpfCnpj() != null) cliente.setCpfCnpj(dados.getCpfCnpj());
        if (dados.getEmail() != null) cliente.setEmail(dados.getEmail().trim().toLowerCase());
        if (dados.getSenha() != null && !dados.getSenha().isBlank()) cliente.setSenha(dados.getSenha());
        cliente.setRua(dados.getRua());
        cliente.setNumero(dados.getNumero());
        cliente.setBairro(dados.getBairro());
        cliente.setCidade(dados.getCidade());
        cliente.setCep(dados.getCep());

        return repository.save(cliente);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarCliente(@PathVariable Integer id) {
        buscar(id);
        if (reservaRepository.existsByClienteIdCliente(id)) {
            throw new RegraNegocioException("Este cliente possui reservas e não pode ser excluído.");
        }
        repository.deleteById(id);
    }

    private void exigir(String valor, String mensagem) {
        if (valor == null || valor.isBlank()) throw new RegraNegocioException(mensagem);
    }
}
