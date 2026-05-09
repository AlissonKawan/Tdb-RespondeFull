package test;

import dao.*;
import model.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DAOTestRunner {

    public static void main(String[] args) {
        try {
            System.out.println(" INICIANDO TESTES DOS DAOs \n");
            CanalComunicacao canal        = testCanalComunicacao();
            Especialidade especialidade   = testEspecialidade();
            Voluntario voluntario         = testVoluntario(especialidade);
            CriancaAdolescente crianca    = testCriancaAdolescente();
            MulherApolonia mulher         = testMulherApolonia();
            Atendimento atendimento       = testAtendimento(crianca, voluntario, canal);
            testMensagem(atendimento, canal);
            testHistoricoStatus(atendimento, voluntario);

            System.out.println("\n TODOS OS TESTES EXECUTADOS COM SUCESSO!!!!!");

        } catch (Exception e) {
            System.err.println("FALHA GERAL NOS TESTES: " + e.getMessage());
            e.printStackTrace();
        }
    }

    //  CANAL
    private static CanalComunicacao testCanalComunicacao() {
        System.out.println("Testando CanalComunicacaoDAO...");
        CanalComunicacaoDAO dao = new CanalComunicacaoDAO();

        CanalComunicacao c = new CanalComunicacao();
        c.setNome("WhatsApp");
        c.setDescricao("Contato via WhatsApp pessoal");
        dao.inserir(c);
        System.out.println("Inserido canal ID: " + c.getId());

        CanalComunicacao encontrado = dao.buscarPorId(c.getId());
        System.out.println("Buscado: " + encontrado.getNome());

        List<CanalComunicacao> todos = dao.buscarTodos();
        System.out.println("Total canais: " + todos.size());

        System.out.println("→ OK Canal\n");
        return c; // retorna para outros testes usarem
    }

    //  ESPECIALIDADE
    private static Especialidade testEspecialidade() {
        System.out.println("Testando EspecialidadeDAO...");
        EspecialidadeDAO dao = new EspecialidadeDAO();

        Especialidade e = new Especialidade();
        e.setNome("Odontologia " + System.currentTimeMillis());
        e.setDescricao("Atendimento odontológico infantil");
        dao.inserir(e);
        System.out.println("ID gerado: " + e.getId());

        Especialidade encontrada = dao.buscarPorId(e.getId());
        System.out.println("→ OK Especialidade: " + encontrada.getNome() + " (ID " + encontrada.getId() + ")\n");
        return e;
    }

    //  VOLUNTARIO
    private static Voluntario testVoluntario(Especialidade especialidade) {
        System.out.println("Testando VoluntarioDAO...");
        VoluntarioDAO dao = new VoluntarioDAO();

        Voluntario v = new Voluntario();
        v.setNome("Dr. Alisson Marcão");
        v.setUsuario("Alisson.marcao.odonto." + System.currentTimeMillis()); // evita duplicata de usuario
        v.setSenha("123456");
        v.setAcessoSigilo(true);
        v.setDisponivel(true);
        v.setEspecialidade(especialidade); // usa a especialidade que acabamos de inserir
        dao.inserir(v);
        System.out.println("Voluntário inserido ID: " + v.getId());

        Voluntario encontrado = dao.buscarPorId(v.getId());
        System.out.println("→ OK Voluntário: " + encontrado.getNome() + "\n");
        return v;
    }

    // CRIANCA
    private static CriancaAdolescente testCriancaAdolescente() {
        System.out.println("Testando CriancaAdolescenteDAO...");
        CriancaAdolescenteDAO dao = new CriancaAdolescenteDAO();

        CriancaAdolescente ca = new CriancaAdolescente();
        ca.setNomeCodificado("Criança XYZ-123");
        ca.setData(LocalDate.now().minusYears(10));
        ca.setTelefone("(11) 99999-8888");
        ca.setEmail("responsavel@email.com");
        ca.setIdade(10);
        ca.setNomeResponsavel("Ana Carolina");
        ca.setEscola("EMEI Sol Nascente");
        ca.setGravidadeBucal(4);
        dao.inserir(ca);
        System.out.println("→ OK Criança inserida ID: " + ca.getId() + "\n");
        return ca;
    }

    //  MULHER
    private static MulherApolonia testMulherApolonia() {
        System.out.println("Testando MulherApoloniaDAO...");
        MulherApoloniaDAO dao = new MulherApoloniaDAO();

        MulherApolonia ma = new MulherApolonia();
        ma.setCodinome("Luz");
        ma.setData(LocalDate.now().minusDays(15));
        ma.setTelefone("(21) 98888-7777");
        ma.setEmail(null);
        ma.setNivelRisco(3);
        ma.setTemBoletimOcorrencia(true);
        ma.setNecessitaSigiloAbsoluto(true);
        dao.inserir(ma);
        System.out.println("→ OK Apolônia inserida ID: " + ma.getId() + "\n");
        return ma;
    }

    //  ATENDIMENTO
    private static Atendimento testAtendimento(CriancaAdolescente crianca, Voluntario voluntario, CanalComunicacao canal) {
        System.out.println("Testando AtendimentoDAO...");
        AtendimentoDAO dao = new AtendimentoDAO();

        Atendimento a = new Atendimento();
        a.setPessoaAtendida(crianca);
        a.setVoluntario(voluntario);
        a.setCanalOrigem(canal);
        a.setPrioridade(2);
        a.setStatus("ABERTO");
        a.setDataAbertura(LocalDate.now());
        a.setDataEncerramento(null);
        dao.inserir(a);
        System.out.println("Atendimento inserido ID: " + a.getId());

        Atendimento encontrado = dao.buscarPorId(a.getId());
        System.out.println("→ OK Atendimento: status=" + encontrado.getStatus() + "\n");
        return a;
    }

    //  MENSAGEM
    // Recebe atendimento e canal — Mensagem precisa dos IDs deles
    private static void testMensagem(Atendimento atendimento, CanalComunicacao canal) {
        System.out.println("Testando MensagemDAO...");
        MensagemDAO dao = new MensagemDAO();

        Mensagem m = new Mensagem();
        m.setAtendimento(atendimento);
        m.setCanal(canal);
        m.setConteudo("Olá, preciso de ajuda.");
        m.setDataHora(LocalDateTime.now());
        m.setEnviadoPor("PESSOA_ATENDIDA");
        dao.inserir(m);
        System.out.println("Mensagem inserida ID: " + m.getId());

        List<Mensagem> mensagens = dao.buscarPorAtendimento(atendimento.getId());
        System.out.println("Total mensagens do atendimento: " + mensagens.size());
        System.out.println("→ OK Mensagem\n");
    }

    // Recebe atendimento e voluntario
    private static void testHistoricoStatus(Atendimento atendimento, Voluntario voluntario) {
        System.out.println("Testando HistoricoStatusDAO...");
        HistoricoStatusDAO dao = new HistoricoStatusDAO();

        HistoricoStatus h = new HistoricoStatus();
        h.setAtendimento(atendimento);
        h.setAlteradoPor(voluntario);
        h.setStatusAnterior("ABERTO");
        h.setStatusNovo("EM_ATENDIMENTO");
        h.setDataHora(LocalDateTime.now());
        dao.inserir(h);
        System.out.println("Histórico inserido ID: " + h.getId());

        List<HistoricoStatus> historicos = dao.buscarPorAtendimento(atendimento.getId());
        System.out.println("Total históricos do atendimento: " + historicos.size());
        System.out.println("→ OK HistoricoStatus\n");
    }
}