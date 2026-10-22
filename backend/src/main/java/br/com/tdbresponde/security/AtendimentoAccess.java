package br.com.tdbresponde.security;

import br.com.tdbresponde.bo.AtendimentoBO;
import br.com.tdbresponde.bo.ContaUsuarioBO;
import br.com.tdbresponde.dao.PessoaAtendidaDAO;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.dto.RelatarSituacaoRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.AgendaConsulta;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.SecurityContext;
import java.util.Objects;
import java.util.function.Predicate;
import java.util.HashMap;
import java.util.Map;

/** Politica compartilhada por REST e emissao de tickets de conversa. */
@RequestScoped
public class AtendimentoAccess {
    private final AtendimentoBO atendimentos;
    private final ContaUsuarioBO contas;
    private final PessoaAtendidaDAO pessoas;
    // Reuso somente durante uma requisicao: nenhuma permissao e mantida entre requisicoes.
    private final Map<Integer, Atendimento> referencias = new HashMap<>();
    private final Map<Integer, Integer> voluntariosPorConta = new HashMap<>();

    @Inject
    public AtendimentoAccess(AtendimentoBO atendimentos, ContaUsuarioBO contas, PessoaAtendidaDAO pessoas) {
        this.atendimentos = atendimentos;
        this.contas = contas;
        this.pessoas = pessoas;
    }

    public int contaId(SecurityContext identity) {
        if (identity == null || identity.getUserPrincipal() == null) {
            throw new UnauthorizedException("Sessao invalida ou expirada. Entre novamente.");
        }
        return Integer.parseInt(identity.getUserPrincipal().getName());
    }

    public boolean admin(SecurityContext identity) {
        contaId(identity);
        return identity.isUserInRole("ADMIN");
    }

    public void exigirAdmin(SecurityContext identity) {
        if (!admin(identity)) throw new ForbiddenException();
    }

    public boolean filaAberta(Atendimento atendimento) {
        return atendimento.getVoluntario() == null && "ABERTO".equals(atendimento.getStatus());
    }

    public boolean podeConversar(Atendimento atendimento, SecurityContext identity) {
        int conta = contaId(identity);
        if (admin(identity)) return true;
        if (identity.isUserInRole("BENEFICIARIO")) {
            return atendimento.getPessoaAtendida() != null
                    && Objects.equals(conta, atendimento.getPessoaAtendida().getContaId());
        }
        if (identity.isUserInRole("VOLUNTARIO")) {
            if (atendimento.getVoluntario() != null && atendimento.getVoluntario().getContaId() != null) {
                return Objects.equals(conta, atendimento.getVoluntario().getContaId());
            }
            Integer voluntario = voluntarioDaConta(conta);
            return voluntario != null && atendimento.getVoluntario() != null
                    && voluntario == atendimento.getVoluntario().getId();
        }
        return false;
    }

    public boolean podeConsultar(Atendimento atendimento, SecurityContext identity) {
        return consultaPermitida(identity).test(atendimento);
    }

    public Predicate<Atendimento> consultaPermitida(SecurityContext identity) {
        int conta = contaId(identity);
        if (admin(identity)) return a -> true;
        if (identity.isUserInRole("BENEFICIARIO")) {
            return a -> a.getPessoaAtendida() != null && Objects.equals(conta, a.getPessoaAtendida().getContaId());
        }
        if (identity.isUserInRole("VOLUNTARIO")) {
            Integer voluntario = voluntarioDaConta(conta);
            return a -> filaAberta(a) || (voluntario != null && a.getVoluntario() != null
                    && voluntario == a.getVoluntario().getId());
        }
        return a -> false;
    }

    public Atendimento consultar(int id, SecurityContext identity) {
        Atendimento atendimento = carregar(id);
        if (!podeConsultar(atendimento, identity)) throw new ForbiddenException();
        return atendimento;
    }

    public Atendimento conversar(int id, SecurityContext identity) {
        if (id <= 0) throw new BusinessException("ID do atendimento deve ser valido");
        Atendimento atendimento = referencias.computeIfAbsent(id, atendimentos::buscarParaAutorizacao);
        if (!podeConversar(atendimento, identity)) throw new ForbiddenException();
        return atendimento;
    }

    public Atendimento alterar(int id, SecurityContext identity) {
        if (!admin(identity) && !identity.isUserInRole("VOLUNTARIO")) throw new ForbiddenException();
        return conversar(id, identity);
    }

    public void validarAtualizacao(Atendimento atual, AtendimentoRequest request, SecurityContext identity) {
        if (request == null || admin(identity)) return;
        if (atual.getPessoaAtendida() == null
                || !Objects.equals(request.pessoaAtendidaId, atual.getPessoaAtendida().getId())
                || atual.getVoluntario() == null
                || !Objects.equals(request.voluntarioId, atual.getVoluntario().getId())) {
            throw new ForbiddenException();
        }
    }

    public Integer responsavel(Integer solicitado, SecurityContext identity) {
        if (admin(identity)) return solicitado;
        if (!identity.isUserInRole("VOLUNTARIO")) throw new ForbiddenException();
        Integer proprio = voluntarioDaConta(contaId(identity));
        if (proprio == null || (solicitado != null && !proprio.equals(solicitado))) throw new ForbiddenException();
        return proprio;
    }

    public void listarPorVoluntario(int id, SecurityContext identity) {
        if (!admin(identity) && !Objects.equals(id, responsavel(null, identity))) throw new ForbiddenException();
    }

    public void agenda(AgendaConsulta agenda, SecurityContext identity) {
        if (agenda == null) throw new BusinessException("Informe os dados da consulta");
        listarPorVoluntario(agenda.getVoluntarioId(), identity);
        if (agenda.getAtendimentoId() != null && agenda.getAtendimentoId() > 0) {
            alterar(agenda.getAtendimentoId(), identity);
        }
    }

    public void listarPorConta(int id, SecurityContext identity) {
        int conta = contaId(identity);
        if (identity.isUserInRole("BENEFICIARIO") && conta != id) throw new ForbiddenException();
    }

    public void listarPorBeneficiario(int id, SecurityContext identity) {
        contaId(identity);
        if (identity.isUserInRole("BENEFICIARIO")) {
            var pessoa = pessoas.buscarPorId(id);
            if (pessoa == null) throw new NotFoundException("Beneficiario nao encontrado");
            if (!Objects.equals(pessoa.getContaId(), contaId(identity))) throw new ForbiddenException();
        }
    }

    public void vincularRelato(RelatarSituacaoRequest request, SecurityContext identity) {
        int conta = contaId(identity);
        if (request == null) throw new BusinessException("Dados do relato sao obrigatorios");
        if (!admin(identity)) {
            if (!identity.isUserInRole("BENEFICIARIO")
                    || (request.idContaBeneficiario != null && request.idContaBeneficiario != conta)) {
                throw new ForbiddenException();
            }
            request.idContaBeneficiario = conta;
        }
    }

    public String remetente(SecurityContext identity) {
        contaId(identity);
        for (String role : new String[]{"ADMIN", "VOLUNTARIO", "BENEFICIARIO"}) {
            if (identity.isUserInRole(role)) return role;
        }
        throw new ForbiddenException();
    }

    private Integer voluntarioDaConta(int conta) {
        if (!voluntariosPorConta.containsKey(conta)) {
            voluntariosPorConta.put(conta, contas.buscarVoluntarioIdDaConta(conta));
        }
        return voluntariosPorConta.get(conta);
    }

    private Atendimento carregar(int id) {
        if (id <= 0) throw new BusinessException("ID do atendimento deve ser valido");
        return atendimentos.buscarPorId(id);
    }
}
