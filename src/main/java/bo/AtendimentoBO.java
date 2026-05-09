package bo;

import dao.AtendimentoDAO;
import dao.HistoricoStatusDAO;
import dao.VoluntarioDAO;
import model.Atendimento;
import model.HistoricoStatus;
import model.MulherApolonia;
import model.Voluntario;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

//Aqui temos a classe que irá criar os métodos de negócio do projeto

public class AtendimentoBO {

    private final AtendimentoDAO atendimentoDAO = new AtendimentoDAO();
    private final HistoricoStatusDAO historicoDAO = new HistoricoStatusDAO();
    private final VoluntarioDAO voluntarioDAO = new VoluntarioDAO();

    // Metodo: Calcular prioridade automaticamente
    // Regra de negócio: quanto maior o risco da mulher, maior a prioridade
    // Prioridade 1 = urgente, 2 = alta, 3 = normal
    public int calcularPrioridade(MulherApolonia mulher) {
        if (mulher == null) {
            throw new IllegalArgumentException("Mulher não pode ser nula para calcular prioridade");
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
            throw new IllegalArgumentException("Atendimento não pode ser nulo");
        }

        String statusAtual = atendimento.getStatus();

        // Regra: só encerra se estiver aberto ou em andamento
        if (statusAtual.equals("ENCERRADO")) {
            throw new IllegalStateException(
                    "Atendimento ID " + atendimento.getId() + " já está encerrado!"
            );
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
            throw new IllegalArgumentException("Voluntário e atendimento não podem ser nulos");
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
            throw new IllegalArgumentException("Atendimento não pode ser nulo");
        }
        if (atendimento.getDataAbertura() == null) {
            throw new IllegalStateException("Atendimento sem data de abertura");
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
}
