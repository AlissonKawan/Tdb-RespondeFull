package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.dao.CriancaAdolescenteDAO;
import br.com.tdbresponde.dao.EspecialidadeDAO;
import br.com.tdbresponde.dao.MulherApoloniaDAO;
import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.dto.ContaUsuarioRequest;
import br.com.tdbresponde.dto.LoginRequest;
import br.com.tdbresponde.dto.RegisterRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ConflictException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.security.SenhaHasher;
import br.com.tdbresponde.client.CroVerificationService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@ApplicationScoped
public class ContaUsuarioBO {

    private static final Pattern EMAIL_VALIDO = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    @Inject
    ContaUsuarioDAO dao;

    @Inject
    VoluntarioDAO voluntarioDAO;

    @Inject
    CroVerificationService croService;

    @Inject
    CriancaAdolescenteDAO criancaDAO;

    @Inject
    MulherApoloniaDAO mulherDAO;

    @Inject
    EspecialidadeDAO especialidadeDAO;

    @Transactional
    public ContaUsuario registrar(RegisterRequest request) {
        validarCadastro(request);

        String email = isBlank(request.email) ? null : normalizarEmail(request.email);
        if (email != null && dao.emailExiste(email)) {
            throw new ConflictException("Este e-mail já está cadastrado.");
        }

        TipoUsuario tipo = parseTipoCadastro(request.tipoUsuario);
        List<Especialidade> especialidades = tipo == TipoUsuario.VOLUNTARIO
                ? resolverEspecialidadesVoluntario(request)
                : List.of();
        String senhaHash = SenhaHasher.gerarHash(request.senha);

        ContaUsuario conta = new ContaUsuario();
        boolean apolonia = cadastroApolonia(request);
        conta.setNome(apolonia && "GERADO".equals(request.modoIdentificacao)
                ? "Pessoa " + java.util.UUID.randomUUID().toString().substring(0, 8)
                : request.nome.trim());
        if (apolonia) {
            String usuario = request.usuario.trim().toLowerCase(java.util.Locale.ROOT);
            if (dao.buscarPorUsuario(usuario) != null) {
                throw new ConflictException("Este nome de usuário já está em uso.");
            }
            conta.setUsuario(usuario);
            conta.setTipoBeneficiario("MULHER_APOLONIA");
            conta.setModoIdentificacao(request.modoIdentificacao);
        }
        conta.setEmail(email);
        conta.setSenhaHash(senhaHash);
        conta.setTipoUsuario(tipo);
        conta.setAtivo(tipo != TipoUsuario.VOLUNTARIO);

        dao.cadastrarConta(conta);

        if (tipo == TipoUsuario.VOLUNTARIO) {
            Voluntario voluntario = criarVoluntarioParaConta(conta, request, senhaHash, especialidades);
            voluntarioDAO.inserir(voluntario);
            if (voluntario.getId() <= 0) {
                throw new BusinessException("Nao foi possivel vincular a conta ao cadastro de voluntario.");
            }
        }

        return dao.buscarPorId(conta.getId());
    }

    public ContaUsuario login(LoginRequest request) {
        validarLogin(request);

        String identificador = request.email.trim().toLowerCase(java.util.Locale.ROOT);
        ContaUsuario conta = identificador.contains("@")
                ? dao.buscarPorEmail(identificador) : dao.buscarPorUsuario(identificador);
        if (conta == null || !SenhaHasher.validarSenha(request.senha, conta.getSenhaHash())) {
            throw new UnauthorizedException("Usuário, e-mail ou senha inválidos.");
        }
        if (!conta.isAtivo()) {
            throw new UnauthorizedException("Conta inativa.");
        }

        return conta;
    }

    public Integer buscarVoluntarioIdDaConta(int contaId) {
        return voluntarioDAO.buscarIdPorContaId(contaId);
    }

    public Voluntario buscarVoluntarioPorContaId(int contaId) {
        return voluntarioDAO.buscarPorContaId(contaId);
    }

    public Integer buscarBeneficiarioIdDaConta(int contaId) {
        CriancaAdolescente crianca = criancaDAO.buscarPorContaId(contaId);
        if (crianca != null) {
            return crianca.getId();
        }

        MulherApolonia mulher = mulherDAO.buscarPorContaId(contaId);
        return mulher != null ? mulher.getId() : null;
    }

    public List<ContaUsuario> listar() {
        return dao.listar();
    }

    public ContaUsuario buscarPorId(int id) {
        ContaUsuario conta = dao.buscarPorId(id);
        if (conta == null) {
            throw new NotFoundException("Conta nao encontrada.");
        }
        return conta;
    }

    public ContaUsuario atualizar(int id, ContaUsuarioRequest request) {
        ContaUsuario atual = buscarPorId(id);
        validarAtualizacao(request, atual);

        String email = isBlank(request.email) ? null : normalizarEmail(request.email);
        ContaUsuario contaDoEmail = email == null ? null : dao.buscarPorEmail(email);
        if (contaDoEmail != null && contaDoEmail.getId() != id) {
            throw new ConflictException("Este e-mail já está cadastrado.");
        }

        atual.setNome(request.nome.trim());
        atual.setEmail(email);
        atual.setTipoUsuario(parseTipo(request.tipoUsuario));
        if (request.ativo != null) {
            atual.setAtivo(request.ativo);
        }

        dao.atualizar(atual);
        return buscarPorId(id);
    }

    public void desativar(int id) {
        buscarPorId(id);
        dao.desativar(id);
    }

    private Voluntario criarVoluntarioParaConta(
            ContaUsuario conta,
            RegisterRequest request,
            String senhaHash,
            List<Especialidade> especialidades
    ) {
        Voluntario voluntario = new Voluntario();

        voluntario.setNome(conta.getNome());
        voluntario.setUsuario(conta.getEmail());
        voluntario.setSenha(senhaHash);
        voluntario.setAcessoSigilo(false);
        voluntario.setDisponivel(true);
        voluntario.setContaId(conta.getId());
        voluntario.setStatusAprovacao("PENDENTE");
        voluntario.setMotivoVoluntariado(request.motivoVoluntariado.trim());
        voluntario.setEspecialidades(especialidades);
        voluntario.setCro(request.cro != null ? request.cro.trim() : null);
        voluntario.setUfCro(request.ufCro != null ? request.ufCro.trim().toUpperCase() : null);
        if (precisaDeCro(request)) {
            voluntario.setStatusCro(croService.obterStatusUltimaVerificacao());
        } else {
            voluntario.setStatusCro(null);
        }

        voluntario.setCodigoIndicacao(java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        if (request.codigoIndicacao != null && !request.codigoIndicacao.trim().isEmpty()) {
            Voluntario indicador = voluntarioDAO.buscarPorCodigoIndicacao(request.codigoIndicacao.trim());
            if (indicador == null) {
                throw new BusinessException("Codigo de indicacao invalido.");
            }
            voluntario.setIdVoluntarioIndicador(indicador.getId());
        }

        return voluntario;
    }

    private void criarBeneficiarioParaConta(ContaUsuario conta, RegisterRequest request) {
        String tipoBeneficiario = normalizarTipoBeneficiario(request.tipoBeneficiario);

        if ("CRIANCA_ADOLESCENTE".equals(tipoBeneficiario)) {
            CriancaAdolescente crianca = new CriancaAdolescente();
            crianca.setContaId(conta.getId());
            crianca.setNomeCodificado(conta.getNome());
            crianca.setData(LocalDate.now());
            crianca.setTelefone(request.telefone);
            crianca.setEmail(conta.getEmail());
            crianca.setIdade(request.idade != null ? request.idade : 0);
            crianca.setNomeResponsavel(request.nomeResponsavel);
            crianca.setEscola(request.escola);
            crianca.setGravidadeBucal(request.gravidadeBucal != null ? request.gravidadeBucal : 1);
            criancaDAO.inserir(crianca);
            return;
        }

        MulherApolonia mulher = new MulherApolonia();
        mulher.setContaId(conta.getId());
        mulher.setNomeCodificado(conta.getNome());
        mulher.setData(LocalDate.now());
        mulher.setTelefone(request.telefone);
        mulher.setEmail(conta.getEmail());
        mulher.setCodinome(isBlank(request.codinome) ? conta.getNome() : request.codinome.trim());
        mulher.setNivelRisco(request.nivelRisco != null ? request.nivelRisco : 1);
        mulher.setTemBoletimOcorrencia(request.temBoletimOcorrencia);
        mulher.setNecessitaSigiloAbsoluto(true);
        mulherDAO.inserir(mulher);
    }

    private boolean cadastroApolonia(RegisterRequest request) {
        return "BENEFICIARIO".equalsIgnoreCase(request.tipoUsuario)
                && "MULHER_APOLONIA".equals(request.tipoBeneficiario);
    }

    private void validarCadastro(RegisterRequest request) {
        if (request == null) {
            throw new BusinessException("Dados de cadastro sao obrigatorios.");
        }
        boolean apolonia = cadastroApolonia(request);
        if (apolonia) {
            if (!java.util.Set.of("NOME", "CODINOME", "GERADO").contains(
                    request.modoIdentificacao == null ? "" : request.modoIdentificacao)) {
                throw new BusinessException("Escolha como deseja se apresentar.");
            }
            if (isBlank(request.usuario) || !request.usuario.trim().matches("[A-Za-z0-9._-]{3,40}")) {
                throw new BusinessException("Use um usuário de 3 a 40 letras, números, pontos, traços ou sublinhados.");
            }
            if (!isBlank(request.email)) validarEmail(request.email);
        } else {
            validarEmail(request.email);
        }
        if ((!apolonia || !"GERADO".equals(request.modoIdentificacao)) && isBlank(request.nome)) {
            throw new BusinessException("Informe o nome ou codinome escolhido.");
        }
        if (apolonia && !isBlank(request.nome) && request.nome.trim().length() > 50) {
            throw new BusinessException("Use até 50 caracteres para o nome ou codinome.");
        }
        if (isBlank(request.senha)) {
            throw new BusinessException("Senha e obrigatoria.");
        }
        if (request.senha.length() < 6) {
            throw new BusinessException("A senha deve ter pelo menos 6 caracteres.");
        }
        TipoUsuario tipo = parseTipoCadastro(request.tipoUsuario);
        if (tipo == TipoUsuario.VOLUNTARIO) {
            validarVoluntario(request);
        }
        if (tipo == TipoUsuario.BENEFICIARIO) {
            validarBeneficiario(request);
        }
    }

    private void validarVoluntario(RegisterRequest request) {
        if (isBlank(request.motivoVoluntariado)) {
            throw new BusinessException("Motivo do voluntariado e obrigatorio.");
        }
        if (request.motivoVoluntariado.trim().length() < 20) {
            throw new BusinessException("Motivo do voluntariado deve ter pelo menos 20 caracteres.");
        }
        if (!temEspecialidadeInformada(request)) {
            throw new BusinessException("Especialidade e obrigatoria para cadastro de voluntario.");
        }
        
        if (precisaDeCro(request)) {
            if (isBlank(request.cro)) {
                throw new BusinessException("CRO e obrigatorio para cadastro de voluntario.");
            }
            if (isBlank(request.ufCro)) {
                throw new BusinessException("UF do CRO e obrigatoria para cadastro de voluntario.");
            }
            if (!croService.verificar(request.cro, request.ufCro)) {
                throw new BusinessException("CRO informado nao foi validado pelo conselho regional.");
            }
        }
    }

    private boolean precisaDeCro(RegisterRequest request) {
        List<Integer> ids = new ArrayList<>();
        if (request.especialidadeIds != null) {
            ids.addAll(request.especialidadeIds);
        }
        if (request.especialidadeId != null) {
            ids.add(request.especialidadeId);
        }
        for (Integer id : ids.stream().filter(id -> id != null && id > 0).distinct().toList()) {
            Especialidade esp = especialidadeDAO.buscarPorId(id);
            if (esp != null && "Odontologia".equalsIgnoreCase(esp.getNome())) {
                return true;
            }
        }
        if (!isBlank(request.especialidade) && "Odontologia".equalsIgnoreCase(request.especialidade.trim())) {
            return true;
        }
        return false;
    }

    private void validarBeneficiario(RegisterRequest request) {
        // Cadastro do beneficiário cria apenas a conta.
        // Os dados específicos serão coletados no fluxo de atendimento.
    }

    private void validarLogin(LoginRequest request) {
        if (request == null) {
            throw new BusinessException("Dados de login sao obrigatorios.");
        }
        if (isBlank(request.email)) throw new BusinessException("Informe seu usuário ou e-mail.");
        if (request.email.contains("@")) validarEmail(request.email);
        else if (!request.email.trim().matches("[A-Za-z0-9._-]{3,40}")) {
            throw new BusinessException("Informe um usuário válido.");
        }
        if (isBlank(request.senha)) {
            throw new BusinessException("Senha e obrigatoria.");
        }
    }

    private void validarAtualizacao(ContaUsuarioRequest request, ContaUsuario atual) {
        if (request == null) {
            throw new BusinessException("Dados da conta sao obrigatorios.");
        }
        if (isBlank(request.nome)) {
            throw new BusinessException("Nome e obrigatorio.");
        }
        boolean permiteSemEmail = "MULHER_APOLONIA".equals(atual.getTipoBeneficiario())
                && !isBlank(atual.getUsuario()) && "BENEFICIARIO".equals(request.tipoUsuario);
        if (!permiteSemEmail || !isBlank(request.email)) validarEmail(request.email);
        parseTipo(request.tipoUsuario);
    }

    private void validarEmail(String email) {
        if (isBlank(email)) {
            throw new BusinessException("Email e obrigatorio.");
        }
        if (!EMAIL_VALIDO.matcher(email.trim()).matches()) {
            throw new BusinessException("Informe um e-mail valido.");
        }
    }

    private TipoUsuario parseTipo(String tipoUsuario) {
        if (isBlank(tipoUsuario)) {
            throw new BusinessException("Tipo de usuario e obrigatorio.");
        }
        try {
            return TipoUsuario.valueOf(tipoUsuario.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Tipo de usuario invalido.");
        }
    }

    private TipoUsuario parseTipoCadastro(String tipoUsuario) {
        TipoUsuario tipo = parseTipo(tipoUsuario);
        if (tipo == TipoUsuario.ADMIN) {
            throw new BusinessException("Cadastro publico deve ser BENEFICIARIO ou VOLUNTARIO.");
        }
        return tipo;
    }

    private String normalizarTipoBeneficiario(String tipoBeneficiario) {
        if (isBlank(tipoBeneficiario)) {
            throw new BusinessException("Tipo de beneficiario e obrigatorio para cadastro de beneficiario.");
        }

        String tipo = tipoBeneficiario.trim().toUpperCase().replace("-", "_");
        if ("CRIANCA".equals(tipo) || "ADOLESCENTE".equals(tipo) || "CRIANCA_ADOLESCENTE".equals(tipo)) {
            return "CRIANCA_ADOLESCENTE";
        }
        if ("MULHER".equals(tipo) || "MULHER_APOLONIA".equals(tipo) || "APOLONIA".equals(tipo)) {
            return "MULHER_APOLONIA";
        }
        throw new BusinessException("Tipo de beneficiario invalido.");
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }

    private List<Especialidade> resolverEspecialidadesVoluntario(RegisterRequest request) {
        List<Especialidade> especialidades = new ArrayList<>();
        List<Integer> ids = new ArrayList<>();

        if (request.especialidadeIds != null) {
            ids.addAll(request.especialidadeIds);
        }
        if (request.especialidadeId != null) {
            ids.add(request.especialidadeId);
        }

        for (Integer id : ids.stream().filter(id -> id != null && id > 0).distinct().toList()) {
            Especialidade especialidade = especialidadeDAO.buscarPorId(id);
            if (especialidade == null) {
                throw new BusinessException("Especialidade informada nao existe.");
            }
            especialidades.add(especialidade);
        }

        if (especialidades.isEmpty() && !isBlank(request.especialidade)) {
            Especialidade especialidade = especialidadeDAO.buscarPorNome(request.especialidade.trim());
            if (especialidade == null) {
                throw new BusinessException("Especialidade informada nao existe.");
            }
            especialidades.add(especialidade);
        }

        if (especialidades.isEmpty()) {
            throw new BusinessException("Especialidade e obrigatoria para cadastro de voluntario.");
        }

        return especialidades;
    }

    private boolean temEspecialidadeInformada(RegisterRequest request) {
        boolean temId = request.especialidadeId != null && request.especialidadeId > 0;
        boolean temLista = request.especialidadeIds != null
                && request.especialidadeIds.stream().anyMatch(id -> id != null && id > 0);
        return temId || temLista || !isBlank(request.especialidade);
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
