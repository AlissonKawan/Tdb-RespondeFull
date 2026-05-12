package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dao.HistoricoStatusDAO;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CanalComunicacao;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.HistoricoStatus;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.Voluntario;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

//Aqui temos a classe que irá criar os métodos de negócio do projeto

@ApplicationScoped
public class AtendimentoBO {

    @Inject
    AtendimentoDAO atendimentoDAO;

    @Inject
    HistoricoStatusDAO historicoDAO;

    public List<Atendimento> listar() {
        return atendimentoDAO.buscarTodos();
    }

    public List<Atendimento> listarSolicitados() {
        return atendimentoDAO.buscarSolicitados();
    }

    public List<Atendimento> listarPorVoluntario(int voluntarioId) {
        if (voluntarioId <= 0) {
            throw new BusinessException("ID do voluntario deve ser valido");
        }
        return atendimentoDAO.buscarPorVoluntario(voluntarioId);
    }

    public Atendimento buscarPorId(int id) {
        Atendimento atendimento = atendimentoDAO.buscarPorId(id);
        if (atendimento == null) {
            throw new NotFoundException("Atendimento nao encontrado");
        }
        return atendimento;
    }

    public Atendimento inserir(AtendimentoRequest request) {
        Atendimento atendimento = toModel(request);
        validar(atendimento);
        atendimentoDAO.inserir(atendimento);
        return atendimento;
    }

    public Atendimento atualizar(int id, AtendimentoRequest request) {
        buscarPorId(id);
        Atendimento atendimento = toModel(request);
        atendimento.setId(id);
        validar(atendimento);
        atendimentoDAO.atualizar(atendimento);
        return atendimento;
    }

    public void excluir(int id) {
        buscarPorId(id);
        atendimentoDAO.excluir(id);
    }

    // Metodo: Calcular prioridade automaticamente
    // Regra de negócio: quanto maior o risco da mulher, maior a prioridade
    // Prioridade 1 = urgente, 2 = alta, 3 = normal
    public int calcularPrioridade(MulherApolonia mulher) {
        if (mulher == null) {
            throw new BusinessException("Mulher nao pode ser nula para calcular prioridade");
        }

        int nivelRisco = mulher.getNivelRisco();

        if (nivelRisco >= 4) {
            System.out.println("Prioridade URGENTE definida para: " + mulher.getCodinome());
            return 1; // urgente — risco alto (4 ou 5)
        } else if (nivelRisco == 3) {
            System.out.println("Prioridade ALTA definida para: " + mulher.getCodinome());
            return 2; // alta — risco médio
        } else {
            System.out.println("Prioridade NORMAL definida para: " + mulher.getCodinome());
            return 3; // normal — risco baixo (1 ou 2)
        }
    }

    // Metodo 2: Encerrar atendimento
    // Regra de negócio: só pode encerrar se o status for ABERTO ou EM_ATENDIMENTO
    // Ao encerrar: muda status para ENCERRADO e registra data de encerramento
    public void encerrarAtendimento(Atendimento atendimento, Voluntario responsavel) {
        if (atendimento == null) {
            throw new BusinessException("Atendimento nao pode ser nulo");
        }

        String statusAtual = atendimento.getStatus();

        // Regra: só encerra se estiver aberto ou em andamento
        if (statusAtual.equals("ENCERRADO")) {
            throw new BusinessException("Atendimento ID " + atendimento.getId() + " ja esta encerrado!");
        }

        // Salva o status anterior para o histórico
        String statusAnterior = statusAtual;

        // Aplica as mudanças no objeto
        atendimento.setStatus("ENCERRADO");
        atendimento.setDataEncerramento(LocalDate.now());

        // Salva no banco
        atendimentoDAO.atualizar(atendimento);

        // Registra no histórico de status (auditoria)
        HistoricoStatus historico = new HistoricoStatus();
        historico.setAtendimento(atendimento);
        historico.setStatusAnterior(statusAnterior);
        historico.setStatusNovo("ENCERRADO");
        historico.setAlteradoPor(responsavel);
        historico.setDataHora(LocalDateTime.now());
        historicoDAO.inserir(historico);

        System.out.println("Atendimento ID " + atendimento.getId() +
                " encerrado em " + atendimento.getDataEncerramento());
    }

    // Metodo 3: Verificar se voluntário pode atender
    // Regra de negócio: voluntário precisa estar disponível
    // Se o atendimento exige sigilo, o voluntário precisa ter acesso a sigilo
    public boolean voluntarioPodeAtender(Voluntario voluntario, Atendimento atendimento) {
        if (voluntario == null || atendimento == null) {
            throw new BusinessException("Voluntario e atendimento nao podem ser nulos");
        }

        // Regra 1: voluntário precisa estar disponível
        if (!voluntario.isDisponivel()) {
            System.out.println("Voluntário " + voluntario.getNome() + " não está disponível.");
            return false;
        }

        // Regra 2: se a pessoa atendida necessita sigilo absoluto,
        // o voluntário precisa ter acesso a sigilo
        if (atendimento.getPessoaAtendida() instanceof MulherApolonia) {
            MulherApolonia mulher = (MulherApolonia) atendimento.getPessoaAtendida();
            if (mulher.isNecessitaSigiloAbsoluto() &&
                    (voluntario.getAcessoSigilo() == null || !voluntario.getAcessoSigilo())) {
                System.out.println("Voluntário " + voluntario.getNome() +
                        " não tem acesso a sigilo para atender este caso.");
                return false;
            }
        }

        System.out.println("Voluntário " + voluntario.getNome() + " PODE atender.");
        return true;
    }

    // Metodo 4: Calcular tempo de atendimento em dias
    // Regra de negócio: calcula quantos dias o atendimento ficou aberto
    // Se ainda não encerrado, calcula até hoje
    public long calcularTempoAtendimentoDias(Atendimento atendimento) {
        if (atendimento == null) {
            throw new BusinessException("Atendimento nao pode ser nulo");
        }
        if (atendimento.getDataAbertura() == null) {
            throw new BusinessException("Atendimento sem data de abertura");
        }

        LocalDate inicio = atendimento.getDataAbertura();
        LocalDate fim;

        if (atendimento.getDataEncerramento() != null) {
            fim = atendimento.getDataEncerramento(); // já encerrado
        } else {
            fim = LocalDate.now(); // ainda em aberto — calcula até hoje
        }

        long dias = ChronoUnit.DAYS.between(inicio, fim);

        System.out.println("Atendimento ID " + atendimento.getId() +
                " durou/está durando " + dias + " dia(s).");

        return dias;
    }

    private Atendimento toModel(AtendimentoRequest request) {
        Atendimento atendimento = new Atendimento();
        if (request != null) {
            atendimento.setPrioridade(request.prioridade);
            atendimento.setStatus(request.status);
            atendimento.setDataAbertura(request.dataAbertura);
            atendimento.setDataEncerramento(request.dataEncerramento);

            if (request.pessoaAtendidaId != null) {
                CriancaAdolescente pessoa = new CriancaAdolescente();
                pessoa.setId(request.pessoaAtendidaId);
                atendimento.setPessoaAtendida(pessoa);
            }
            if (request.voluntarioId != null) {
                Voluntario voluntario = new Voluntario();
                voluntario.setId(request.voluntarioId);
                atendimento.setVoluntario(voluntario);
            }
            if (request.canalComunicacaoId != null) {
                CanalComunicacao canal = new CanalComunicacao();
                canal.setId(request.canalComunicacaoId);
                atendimento.setCanalOrigem(canal);
            }
        }
        return atendimento;
    }

    private void validar(Atendimento atendimento) {
        if (isBlank(atendimento.getStatus())) {
            throw new BusinessException("Status do atendimento e obrigatorio");
        }
        if (atendimento.getPessoaAtendida() == null || atendimento.getPessoaAtendida().getId() <= 0) {
            throw new BusinessException("ID da pessoa atendida e obrigatorio");
        }
        if (atendimento.getCanalOrigem() == null || atendimento.getCanalOrigem().getId() <= 0) {
            throw new BusinessException("ID do canal de comunicacao e obrigatorio");
        }
        if (atendimento.getVoluntario() != null && atendimento.getVoluntario().getId() <= 0) {
            throw new BusinessException("ID do voluntario deve ser valido");
        }
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
