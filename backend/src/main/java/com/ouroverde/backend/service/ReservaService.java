package com.ouroverde.backend.service;

import com.ouroverde.backend.dto.DisponibilidadeDTO;
import com.ouroverde.backend.dto.ItemReservaDTO;
import com.ouroverde.backend.dto.ReservaRequestDTO;
import com.ouroverde.backend.exception.EstoqueInsuficienteException;
import com.ouroverde.backend.exception.RecursoNaoEncontradoException;
import com.ouroverde.backend.exception.RegraNegocioException;
import com.ouroverde.backend.model.*;
import com.ouroverde.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Regras de negocio das reservas.
 * O controller so recebe a requisicao HTTP e chama estes metodos.
 */
@Service
public class ReservaService {

    public static final List<String> STATUS_VALIDOS =
            List.of("PENDENTE", "CONFIRMADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO");
    private static final Set<String> STATUS_FINAIS = Set.of("CONCLUIDO", "CANCELADO");
    private static final Set<String> TIPOS_ENTREGA = Set.of("ENTREGA", "RETIRADA");
    private static final Set<String> FORMAS_PAGAMENTO = Set.of("PIX", "PRESENCIAL");
    public static final int MAX_PARCELAS = 3;

    private static final DateTimeFormatter FORMATO_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ReservaRepository reservaRepository;
    private final ClienteRepository clienteRepository;
    private final ServicoRepository servicoRepository;
    private final MaterialRepository materialRepository;
    private final ReservaMaterialRepository reservaMaterialRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          ClienteRepository clienteRepository,
                          ServicoRepository servicoRepository,
                          MaterialRepository materialRepository,
                          ReservaMaterialRepository reservaMaterialRepository) {
        this.reservaRepository = reservaRepository;
        this.clienteRepository = clienteRepository;
        this.servicoRepository = servicoRepository;
        this.materialRepository = materialRepository;
        this.reservaMaterialRepository = reservaMaterialRepository;
    }

    // ------------------------------------------------------------------
    // CRIAR RESERVA (UC05 - Finalizar Pedido + UC Verificar Disponibilidade)
    // ------------------------------------------------------------------
    @Transactional
    public Reserva criar(ReservaRequestDTO dto) {
        if (dto.getIdCliente() == null) throw new RegraNegocioException("Informe o cliente.");
        if (dto.getIdServico() == null) throw new RegraNegocioException("Informe o serviço.");
        if (dto.getDataEvento() == null) throw new RegraNegocioException("Informe a data do evento.");
        if (dto.getDataEvento().isBefore(LocalDate.now())) {
            throw new RegraNegocioException("A data do evento não pode estar no passado.");
        }

        Cliente cliente = clienteRepository.findById(dto.getIdCliente())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado: " + dto.getIdCliente()));
        Servico servico = servicoRepository.findById(dto.getIdServico())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado: " + dto.getIdServico()));

        String tipoEntrega = escolherOpcao(dto.getTipoEntrega(), "RETIRADA", TIPOS_ENTREGA, "Tipo de entrega");
        String formaPagamento = escolherOpcao(dto.getFormaPagamento(), "PIX", FORMAS_PAGAMENTO, "Forma de pagamento");

        int quantidadeParcelas = dto.getQuantidadeParcelas() == null ? 1 : dto.getQuantidadeParcelas();
        if (quantidadeParcelas < 1 || quantidadeParcelas > MAX_PARCELAS) {
            throw new RegraNegocioException("O número de parcelas deve ser entre 1 e " + MAX_PARCELAS + ".");
        }

        Map<Integer, Integer> quantidades = agruparItens(dto.getItens());
        if (quantidades.isEmpty() && servico.getPrecoBase().signum() == 0) {
            throw new RegraNegocioException("Adicione pelo menos um item ao carrinho ou escolha um espaço.");
        }

        Reserva reserva = new Reserva();
        reserva.setCliente(cliente);
        reserva.setServico(servico);
        reserva.setDataSolicitacao(LocalDate.now());
        reserva.setDataEvento(dto.getDataEvento());
        reserva.setDataHoraEvento(dto.getDataHoraEvento());
        reserva.setTipoEntrega(tipoEntrega);
        reserva.setFormaPagamento(formaPagamento);
        reserva.setStatus("PENDENTE");

        BigDecimal valorTotal = servico.getPrecoBase();

        for (Map.Entry<Integer, Integer> entrada : quantidades.entrySet()) {
            Integer idMaterial = entrada.getKey();
            int quantidade = entrada.getValue();

            Material material = materialRepository.buscarComBloqueio(idMaterial)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Material não encontrado: " + idMaterial));

            // Verificar Disponibilidade: o estoque NAO e decrementado.
            // Contamos quanto ja esta reservado nessa mesma data.
            long reservado = reservaMaterialRepository.somarReservadoNaData(idMaterial, dto.getDataEvento());
            long disponivel = material.getQuantidadeEstoque() - reservado;

            if (quantidade > disponivel) {
                throw new EstoqueInsuficienteException(String.format(
                        "Estoque insuficiente para \"%s\" em %s: pedido %d, disponível %d.",
                        material.getNome(), dto.getDataEvento().format(FORMATO_BR),
                        quantidade, Math.max(disponivel, 0)));
            }

            ReservaMaterial item = new ReservaMaterial();
            item.setReserva(reserva);
            item.setMaterial(material);
            item.setQuantidadeAlocada(quantidade);
            item.setPrecoNoMomento(material.getPrecoUnitario());
            reserva.getItens().add(item);

            valorTotal = valorTotal.add(material.getPrecoUnitario().multiply(BigDecimal.valueOf(quantidade)));
        }

        reserva.setValorTotal(valorTotal);
        gerarParcelas(reserva, valorTotal, quantidadeParcelas);

        // cascade = ALL: salva a reserva, os itens e as parcelas de uma vez
        return reservaRepository.save(reserva);
    }

    /**
     * Divide o total em parcelas SEM perder centavos.
     * Ex.: R$ 100,00 em 3x -> 33,34 + 33,33 + 33,33 (antes dava 33,33 x 3 = 99,99).
     * A 1a parcela vence na data da solicitacao (sinal) e as demais a cada mes.
     */
    private void gerarParcelas(Reserva reserva, BigDecimal total, int quantidade) {
        BigDecimal valorBase = total.divide(BigDecimal.valueOf(quantidade), 2, RoundingMode.DOWN);
        BigDecimal sobra = total.subtract(valorBase.multiply(BigDecimal.valueOf(quantidade)));

        for (int i = 1; i <= quantidade; i++) {
            Parcela parcela = new Parcela();
            parcela.setReserva(reserva);
            parcela.getId().setNumeroParcela(i);
            parcela.setValorParcela(i == 1 ? valorBase.add(sobra) : valorBase);
            parcela.setDataVencimento(reserva.getDataSolicitacao().plusMonths(i - 1));
            parcela.setStatusPagamento("PENDENTE");
            reserva.getParcelas().add(parcela);
        }
    }

    /** Junta itens repetidos (mesmo material) e valida as quantidades. */
    private Map<Integer, Integer> agruparItens(List<ItemReservaDTO> itens) {
        Map<Integer, Integer> quantidades = new LinkedHashMap<>();
        if (itens == null) return quantidades;

        for (ItemReservaDTO item : itens) {
            if (item.getIdMaterial() == null) {
                throw new RegraNegocioException("Item do carrinho sem identificação do material.");
            }
            if (item.getQuantidadeAlocada() == null || item.getQuantidadeAlocada() <= 0) {
                throw new RegraNegocioException("A quantidade de cada item deve ser maior que zero.");
            }
            quantidades.merge(item.getIdMaterial(), item.getQuantidadeAlocada(), Integer::sum);
        }
        return quantidades;
    }

    private String escolherOpcao(String valor, String padrao, Set<String> validos, String campo) {
        if (valor == null || valor.isBlank()) return padrao;
        String formatado = valor.trim().toUpperCase();
        if (!validos.contains(formatado)) {
            throw new RegraNegocioException(campo + " inválido. Use: " + String.join(", ", validos));
        }
        return formatado;
    }

    // ------------------------------------------------------------------
    // CONSULTAS
    // ------------------------------------------------------------------
    public List<Reserva> listarTodas() {
        return reservaRepository.findAllByOrderByIdReservaDesc();
    }

    public List<Reserva> listarPorCliente(Integer idCliente) {
        return reservaRepository.findByClienteIdClienteOrderByIdReservaDesc(idCliente);
    }

    public Reserva buscar(Integer id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Reserva não encontrada: " + id));
    }

    public List<DisponibilidadeDTO> disponibilidade(LocalDate data) {
        return materialRepository.findAllByOrderByNomeAsc().stream()
                .map(m -> {
                    int reservado = (int) reservaMaterialRepository.somarReservadoNaData(m.getIdMaterial(), data);
                    int disponivel = Math.max(0, m.getQuantidadeEstoque() - reservado);
                    return new DisponibilidadeDTO(m.getIdMaterial(), m.getQuantidadeEstoque(), reservado, disponivel);
                })
                .toList();
    }

    // ------------------------------------------------------------------
    // UC09 - Monitorar painel: mudar status
    // ------------------------------------------------------------------
    @Transactional
    public Reserva atualizarStatus(Integer id, String novoStatus) {
        if (novoStatus == null || novoStatus.isBlank()) {
            throw new RegraNegocioException("Informe o novo status.");
        }
        String status = novoStatus.trim().toUpperCase();
        if (!STATUS_VALIDOS.contains(status)) {
            throw new RegraNegocioException("Status inválido. Use: " + String.join(", ", STATUS_VALIDOS));
        }

        Reserva reserva = buscar(id);
        if (reserva.getStatus().equals(status)) return reserva;

        // Reserva cancelada ou concluida e "fechada". Reabrir uma cancelada
        // poderia alugar itens que ja foram liberados para outra pessoa.
        if (STATUS_FINAIS.contains(reserva.getStatus())) {
            throw new RegraNegocioException("A reserva já está " + reserva.getStatus() + " e não pode mais ser alterada.");
        }

        reserva.setStatus(status);
        return reservaRepository.save(reserva);
    }

    // ------------------------------------------------------------------
    // Extend: Registrar Pagamento Manual
    // ------------------------------------------------------------------
    @Transactional
    public Reserva pagarParcela(Integer idReserva, Integer numeroParcela) {
        Reserva reserva = buscar(idReserva);

        if ("CANCELADO".equals(reserva.getStatus())) {
            throw new RegraNegocioException("Não é possível registrar pagamento de uma reserva cancelada.");
        }

        Parcela parcela = reserva.getParcelas().stream()
                .filter(p -> p.getId().getNumeroParcela().equals(numeroParcela))
                .findFirst()
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Parcela " + numeroParcela + " não encontrada na reserva " + idReserva));

        if ("PAGO".equals(parcela.getStatusPagamento())) {
            throw new RegraNegocioException("Esta parcela já consta como paga.");
        }

        parcela.setStatusPagamento("PAGO");
        parcela.setDataPagamento(LocalDate.now());

        // Recebeu o primeiro pagamento -> a reserva deixa de ser apenas uma solicitacao.
        if ("PENDENTE".equals(reserva.getStatus())) {
            reserva.setStatus("CONFIRMADO");
        }

        return reservaRepository.save(reserva);
    }
}
