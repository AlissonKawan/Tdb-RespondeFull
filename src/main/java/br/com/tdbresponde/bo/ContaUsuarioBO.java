package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.dto.ContaUsuarioRequest;
import br.com.tdbresponde.dto.LoginRequest;
import br.com.tdbresponde.dto.RegisterRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ConflictException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.security.SenhaHasher;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.regex.Pattern;

@ApplicationScoped
public class ContaUsuarioBO {

    private static final Pattern EMAIL_VALIDO = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    @Inject
    ContaUsuarioDAO dao;

    public ContaUsuario registrar(RegisterRequest request) {
        validarCadastro(request);

        String email = normalizarEmail(request.email);
        if (dao.emailExiste(email)) {
            throw new ConflictException("Este e-mail ja esta cadastrado.");
        }

        ContaUsuario conta = new ContaUsuario();
        conta.setNome(request.nome.trim());
        conta.setEmail(email);
        conta.setSenhaHash(SenhaHasher.gerarHash(request.senha));
        conta.setTipoUsuario(parseTipo(request.tipoUsuario));
        conta.setAtivo(true);

        dao.cadastrarConta(conta);
        return dao.buscarPorId(conta.getId());
    }

    public ContaUsuario login(LoginRequest request) {
        validarLogin(request);

        ContaUsuario conta = dao.buscarPorEmail(normalizarEmail(request.email));
        if (conta == null) {
            throw new NotFoundException("Conta nao encontrada.");
        }
        if (!conta.isAtivo()) {
            throw new UnauthorizedException("Conta inativa.");
        }
        if (!SenhaHasher.validarSenha(request.senha, conta.getSenhaHash())) {
            throw new UnauthorizedException("Senha incorreta.");
        }

        return conta;
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
        validarAtualizacao(request);

        String email = normalizarEmail(request.email);
        ContaUsuario contaDoEmail = dao.buscarPorEmail(email);
        if (contaDoEmail != null && contaDoEmail.getId() != id) {
            throw new ConflictException("Este e-mail ja esta cadastrado.");
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

    private void validarCadastro(RegisterRequest request) {
        if (request == null) {
            throw new BusinessException("Dados de cadastro sao obrigatorios.");
        }
        if (isBlank(request.nome)) {
            throw new BusinessException("Nome e obrigatorio.");
        }
        validarEmail(request.email);
        if (isBlank(request.senha)) {
            throw new BusinessException("Senha e obrigatoria.");
        }
        if (request.senha.length() < 6) {
            throw new BusinessException("A senha deve ter pelo menos 6 caracteres.");
        }
        parseTipo(request.tipoUsuario);
    }

    private void validarLogin(LoginRequest request) {
        if (request == null) {
            throw new BusinessException("Dados de login sao obrigatorios.");
        }
        validarEmail(request.email);
        if (isBlank(request.senha)) {
            throw new BusinessException("Senha e obrigatoria.");
        }
    }

    private void validarAtualizacao(ContaUsuarioRequest request) {
        if (request == null) {
            throw new BusinessException("Dados da conta sao obrigatorios.");
        }
        if (isBlank(request.nome)) {
            throw new BusinessException("Nome e obrigatorio.");
        }
        validarEmail(request.email);
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

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
