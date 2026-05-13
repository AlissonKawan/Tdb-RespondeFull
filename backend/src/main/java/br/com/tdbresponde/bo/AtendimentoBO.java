package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dao.CriancaAdolescenteDAO;
import br.com.tdbresponde.dao.HistoricoStatusDAO;
import br.com.tdbresponde.dao.MulherApoloniaDAO;
import br.com.tdbresponde.dao.PessoaAtendidaDAO;
import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.dto.RelatarSituacaoRequest;
import br.com.tdbresponde.dto.RelatarSituacaoResponse;
import br.com.tdbresponde.dto.SolicitarAtendimentoRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CanalComunicacao;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.HistoricoStatus;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.PessoaAtendida;
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

    @Inject
    PessoaAtendidaDAO pessoaAtendidaDAO;

    @Inject
    CriancaAdolescenteDAO criancaDAO;

    @Inject
    MulherApoloniaDAO mulherDAO;

    @Inject
    VoluntarioDAO voluntarioDAO;

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

    public List<Atendimento> listarPorBeneficiario(int beneficiarioId) {
        if (beneficiarioId <= 0) {
            throw new BusinessException("ID do beneficiario deve ser valido");
        }
        return atendimentoDAO.buscarPorBeneficiario(beneficiarioId);
    }

    public List<Atendimento> listarEmAndamento() {
        return atendimentoDAO.buscarEmAndamento();
    }

    public List<Atendimento> listarEncerrados() {
        return atendimentoDAO.buscarEncerrados();
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

    public Atendimento solicitar(SolicitarAtendimentoRequest request) {
        validarSolicitacao(request);

        PessoaAtendida beneficiario = pessoaAtendidaDAO.buscarPorId(request.beneficiarioId);
        if (beneficiario == null) {
            throw new NotFoundException("Beneficiario nao encontrado");
        }

        Atendimento atendimento = new Atendimento();
        atendimento.setPessoaAtendida(beneficiario);
        atendimento.setPrioridade(request.prioridade > 0 ? request.prioridade : calcularPrioridade(beneficiario));
        atendimento.setStatus("SOLICITADO");
        atendimento.setDescricao(request.descricao.trim());
        atendimento.setDataAbertura(LocalDate.now());
        atendimento.setDataEncerramento(null);
        atendimento.setVoluntario(null);

        CanalComunicacao canal = new CanalComunicacao();
        canal.setId(request.canalComunicacaoId);
        atendimento.setCanalOrigem(canal);

        atendimentoDAO.inserir(atendimento);
        return atendimento;
    }

    public RelatarSituacaoResponse relatar(RelatarSituacaoRequest request) {
        validarRelato(request);

        String tipo = normalizarTipoRelato(request.tipo);
        PessoaAtendida pessoa = criarPessoaRelato(request, tipo);

        Atendimento atendimento = new Atendimento();
        atendimento.setPessoaAtendida(pessoa);
        atendimento.setVoluntario(null);
        atendimento.setPrioridade(request.prioridade);
        atendimento.setStatus("ABERTO");
        atendimento.setDescricao(request.descricao.trim());
        atendimento.setDataAbertura(LocalDate.now());

        CanalComunicacao canal = new CanalComunicacao();
        canal.setId(request.canalComunicacaoId);
        atendimento.setCanalOrigem(canal);

        atendimentoDAO.relatarSituacao(pessoa, tipo, atendimento);

        return new RelatarSituacaoResponse(
                atendimento.getId(),
                pessoa.getId(),
                "ABERTO",
                "Situacao relatada com sucesso."
        );
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

    public Atendimento encerrar(int atendimentoId, int responsavelId) {
        Atendimento atendimento = buscarPorId(atendimentoId);
        Voluntario responsavel = voluntarioDAO.buscarPorId(responsavelId);
        if (responsavel == null) {
            throw new NotFoundException("Voluntario responsavel nao encontrado");
        }

        encerrarAtendimento(atendimento, responsavel);
        return buscarPorId(atendimentoId);
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
        if ("ENCERRADO".equals(normalizarStatus(statusAtual))) {
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
            atendimento.setStatus(isBlank(request.status) ? "ABERTO" : normalizarStatus(request.status));
            atendimento.setDescricao(request.descricao);
            atendimento.setDataAbertura(request.dataAbertura != null ? request.dataAbertura : LocalDate.now());
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
            if (atendimento.getPrioridade() <= 0 && atendimento.getPessoaAtendida() != null) {
                atendimento.setPrioridade(calcularPrioridade(atendimento.getPessoaAtendida()));
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
        if (atendimento.getPrioridade() < 1 || atendimento.getPrioridade() > 4) {
            throw new BusinessException("Prioridade deve estar entre 1 e 4");
        }
    }

    public int calcularPrioridade(CriancaAdolescente crianca) {
        if (crianca == null) {
            throw new BusinessException("Crianca/adolescente nao pode ser nula para calcular prioridade");
        }

        int gravidade = crianca.getGravidadeBucal();
        if (gravidade >= 5) {
            return 1;
        } else if (gravidade == 4) {
            return 2;
        } else if (gravidade == 3) {
            return 3;
        }
        return 4;
    }

    public int calcularPrioridade(PessoaAtendida pessoa) {
        PessoaAtendida pessoaCompleta = buscarPessoaCompleta(pessoa.getId());
        if (pessoaCompleta instanceof MulherApolonia mulher) {
            return calcularPrioridade(mulher);
        }
        if (pessoaCompleta instanceof CriancaAdolescente crianca) {
            return calcularPrioridade(crianca);
        }
        return 4;
    }

    private void validarSolicitacao(SolicitarAtendimentoRequest request) {
        if (request == null) {
            throw new BusinessException("Dados da solicitacao sao obrigatorios");
        }
        if (request.beneficiarioId == null || request.beneficiarioId <= 0) {
            throw new BusinessException("ID do beneficiario e obrigatorio");
        }
        if (request.canalComunicacaoId == null || request.canalComunicacaoId <= 0) {
            throw new BusinessException("ID do canal de comunicacao e obrigatorio");
        }
        if (request.prioridade < 0 || request.prioridade > 4) {
            throw new BusinessException("Prioridade deve estar entre 1 e 4, ou 0 para calcular automaticamente");
        }
        if (isBlank(request.descricao)) {
            throw new BusinessException("Descricao do atendimento e obrigatoria");
        }
    }

    private void validarRelato(RelatarSituacaoRequest request) {
        if (request == null) {
            throw new BusinessException("Dados do relato sao obrigatorios");
        }
        String tipo = normalizarTipoRelato(request.tipo);
        if (isBlank(request.nomeCodificado)) {
            throw new BusinessException("Nome codificado e obrigatorio");
        }
        if (request.canalComunicacaoId == null || request.canalComunicacaoId <= 0) {
            throw new BusinessException("ID do canal de comunicacao e obrigatorio");
        }
        if (request.prioridade == null || request.prioridade < 1 || request.prioridade > 5) {
            throw new BusinessException("Prioridade deve estar entre 1 e 5");
        }
        if (isBlank(request.descricao)) {
            throw new BusinessException("Descricao e obrigatoria");
        }
        if ("CRIANCA_ADOLESCENTE".equals(tipo)) {
            if (request.idade == null) {
                throw new BusinessException("Idade e obrigatoria para crianca/adolescente");
            }
            if (isBlank(request.nomeResponsavel)) {
                throw new BusinessException("Nome do responsavel e obrigatorio para crianca/adolescente");
            }
            if (request.gravidadeBucal == null) {
                throw new BusinessException("Gravidade bucal e obrigatoria para crianca/adolescente");
            }
            if (request.idade < 0 || request.idade > 17) {
                throw new BusinessException("Idade deve estar entre 0 e 17");
            }
            if (request.gravidadeBucal < 1 || request.gravidadeBucal > 5) {
                throw new BusinessException("Gravidade bucal deve estar entre 1 e 5");
            }
        }
        if ("MULHER_APOLONIA".equals(tipo)) {
            if (request.nivelRisco == null) {
                throw new BusinessException("Nivel de risco e obrigatorio para mulher Apolonia");
            }
            if (request.nivelRisco < 1 || request.nivelRisco > 5) {
                throw new BusinessException("Nivel de risco deve estar entre 1 e 5");
            }
        }
    }

    private PessoaAtendida criarPessoaRelato(RelatarSituacaoRequest request, String tipo) {
        PessoaAtendida pessoa;

        if ("CRIANCA_ADOLESCENTE".equals(tipo)) {
            CriancaAdolescente crianca = new CriancaAdolescente();
            crianca.setIdade(request.idade);
            crianca.setNomeResponsavel(request.nomeResponsavel.trim());
            crianca.setEscola(request.escola);
            crianca.setGravidadeBucal(request.gravidadeBucal);
            pessoa = crianca;
        } else if ("MULHER_APOLONIA".equals(tipo)) {
            MulherApolonia mulher = new MulherApolonia();
            mulher.setCodinome(isBlank(request.codinome) ? request.nomeCodificado.trim() : request.codinome.trim());
            mulher.setNivelRisco(request.nivelRisco);
            mulher.setTemBoletimOcorrencia(Boolean.TRUE.equals(request.temBoletimOcorrencia));
            mulher.setNecessitaSigiloAbsoluto(request.necessitaSigiloAbsoluto == null || request.necessitaSigiloAbsoluto);
            pessoa = mulher;
        } else {
            pessoa = new br.com.tdbresponde.model.PessoaAtendidaBase();
        }

        pessoa.setContaId(request.idContaBeneficiario);
        pessoa.setNomeCodificado(request.nomeCodificado.trim());
        pessoa.setTelefone(request.telefone);
        pessoa.setEmail(request.email);
        pessoa.setData(LocalDate.now());

        return pessoa;
    }

    private String normalizarTipoRelato(String tipo) {
        if (isBlank(tipo)) {
            throw new BusinessException("Tipo e obrigatorio");
        }

        String normalizado = tipo.trim().toUpperCase().replace("-", "_").replace(' ', '_');
        if ("CRIANCA".equals(normalizado) || "ADOLESCENTE".equals(normalizado)) {
            return "CRIANCA_ADOLESCENTE";
        }
        if ("MULHER".equals(normalizado) || "APOLONIA".equals(normalizado)) {
            return "MULHER_APOLONIA";
        }
        if ("CRIANCA_ADOLESCENTE".equals(normalizado)
                || "MULHER_APOLONIA".equals(normalizado)
                || "OUTRO".equals(normalizado)) {
            return normalizado;
        }

        throw new BusinessException("Tipo deve ser CRIANCA_ADOLESCENTE, MULHER_APOLONIA ou OUTRO");
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }

    private PessoaAtendida buscarPessoaCompleta(int pessoaId) {
        CriancaAdolescente crianca = criancaDAO.buscarPorId(pessoaId);
        if (crianca != null) {
            return crianca;
        }

        MulherApolonia mulher = mulherDAO.buscarPorId(pessoaId);
        if (mulher != null) {
            return mulher;
        }

        PessoaAtendida pessoa = pessoaAtendidaDAO.buscarPorId(pessoaId);
        if (pessoa == null) {
            throw new NotFoundException("Beneficiario nao encontrado");
        }
        return pessoa;
    }

    private String normalizarStatus(String status) {
        if (status == null) {
            return null;
        }
        return status.trim().toUpperCase().replace(' ', '_');
    }
}
