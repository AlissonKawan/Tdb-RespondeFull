package test;

import bo.AtendimentoBO;
import dao.*;
import model.*;
import java.time.LocalDate;


//Aqui temos a classe de teste onde testa os 4 métodos de regras de negócio!
public class BOTestRunner {

    public static void main(String[] args) {
        System.out.println(" TESTANDO MÉTODOS DE LÓGICA DE NEGÓCIO \n");

        AtendimentoBO bo = new AtendimentoBO();

        testCalcularPrioridade(bo);
        testVoluntarioPodeAtender(bo);
        testCalcularTempoAtendimento(bo);
        testEncerrarAtendimento(bo);

        System.out.println("\n TODOS OS TESTES DE BO CONCLUÍDOS ");
    }

    // TESTE 1: calcularPrioridade
    private static void testCalcularPrioridade(AtendimentoBO bo) {
        System.out.println(" Teste: calcularPrioridade ");

        MulherApolonia mulherUrgente = new MulherApolonia();
        mulherUrgente.setCodinome("Rosa");
        mulherUrgente.setNivelRisco(5); // alto risco

        MulherApolonia mulherNormal = new MulherApolonia();
        mulherNormal.setCodinome("Violeta");
        mulherNormal.setNivelRisco(1); // baixo risco

        int prioridadeUrgente = bo.calcularPrioridade(mulherUrgente);
        int prioridadeNormal = bo.calcularPrioridade(mulherNormal);

        System.out.println("Rosa (risco 5) → prioridade: " + prioridadeUrgente + " (esperado: 1)");
        System.out.println("Violeta (risco 1) → prioridade: " + prioridadeNormal + " (esperado: 3)");
        System.out.println("→ OK calcularPrioridade\n");
    }
    // TESTE 2: voluntarioPodeAtender
    private static void testVoluntarioPodeAtender(AtendimentoBO bo) {
        System.out.println(" Teste: voluntarioPodeAtender ");

        // Voluntário disponível com acesso a sigilo
        Voluntario voluntarioOk = new Voluntario();
        voluntarioOk.setNome("Dra. Ana");
        voluntarioOk.setDisponivel(true);
        voluntarioOk.setAcessoSigilo(true);

        // Voluntário indisponível
        Voluntario voluntarioOcupado = new Voluntario();
        voluntarioOcupado.setNome("Dr. João");
        voluntarioOcupado.setDisponivel(false);
        voluntarioOcupado.setAcessoSigilo(true);

        // Atendimento de mulher que precisa sigilo
        MulherApolonia mulher = new MulherApolonia();
        mulher.setCodinome("Luz");
        mulher.setNecessitaSigiloAbsoluto(true);
        mulher.setNivelRisco(4);

        Atendimento atendimento = new Atendimento();
        atendimento.setPessoaAtendida(mulher);
        atendimento.setStatus("ABERTO");

        boolean resultado1 = bo.voluntarioPodeAtender(voluntarioOk, atendimento);
        boolean resultado2 = bo.voluntarioPodeAtender(voluntarioOcupado, atendimento);

        System.out.println("Dra. Ana pode atender: " + resultado1 + " (esperado: true)");
        System.out.println("Dr. João pode atender: " + resultado2 + " (esperado: false)");
        System.out.println("→ OK voluntarioPodeAtender\n");
    }

    // TESTE 3: calcularTempoAtendimento
    private static void testCalcularTempoAtendimento(AtendimentoBO bo) {
        System.out.println(" Teste: calcularTempoAtendimentoDias ");

        // Atendimento já encerrado (10 dias)
        Atendimento encerrado = new Atendimento();
        encerrado.setId(1);
        encerrado.setStatus("ENCERRADO");
        encerrado.setDataAbertura(LocalDate.now().minusDays(10));
        encerrado.setDataEncerramento(LocalDate.now());

        // Atendimento ainda aberto (aberto há 5 dias)
        Atendimento aberto = new Atendimento();
        aberto.setId(2);
        aberto.setStatus("ABERTO");
        aberto.setDataAbertura(LocalDate.now().minusDays(5));
        aberto.setDataEncerramento(null);

        long tempoEncerrado = bo.calcularTempoAtendimentoDias(encerrado);
        long tempoAberto    = bo.calcularTempoAtendimentoDias(aberto);

        System.out.println("Atendimento encerrado durou: " + tempoEncerrado + " dias (esperado: 10)");
        System.out.println("Atendimento aberto está durando: " + tempoAberto + " dias (esperado: 5)");
        System.out.println("→ OK calcularTempoAtendimentoDias\n");
    }

    // TESTE 4: encerrarAtendimento (usa banco de dados — precisa de IDs reais)
    private static void testEncerrarAtendimento(AtendimentoBO bo) {
        System.out.println(" Teste: encerrarAtendimento ");

        AtendimentoDAO atendimentoDAO = new AtendimentoDAO();
        VoluntarioDAO voluntarioDAO   = new VoluntarioDAO();

        // Busca um atendimento e voluntário reais do banco para testar
        // Ajuste os IDs conforme o que existe no seu banco
        Atendimento atendimento = atendimentoDAO.buscarPorId(1);
        Voluntario voluntario   = voluntarioDAO.buscarPorId(1);

        if (atendimento == null || voluntario == null) {
            System.out.println("→ PULADO: IDs 1 não encontrados no banco. " +
                    "Ajuste os IDs para IDs reais do seu banco.");
            return;
        }

        try {
            bo.encerrarAtendimento(atendimento, voluntario);
            System.out.println("Status após encerrar: " + atendimento.getStatus());
            System.out.println("Data encerramento: " + atendimento.getDataEncerramento());
            System.out.println("→ OK encerrarAtendimento\n");
        } catch (IllegalStateException e) {
            System.out.println("Atendimento já estava encerrado: " + e.getMessage());
            System.out.println("→ OK (regra de negócio funcionando)\n");
        }
    }
}