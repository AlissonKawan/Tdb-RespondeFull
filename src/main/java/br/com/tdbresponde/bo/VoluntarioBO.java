package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.dto.VoluntarioRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.security.SenhaHasher;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class VoluntarioBO {

    @Inject
    VoluntarioDAO dao;

    public List<Voluntario> listar() {
        return dao.buscarTodos();
    }

    public Voluntario buscarPorId(int id) {
        Voluntario voluntario = dao.buscarPorId(id);
        if (voluntario == null) {
            throw new NotFoundException("Voluntario nao encontrado");
        }
        return voluntario;
    }

    public Voluntario inserir(VoluntarioRequest request) {
        Voluntario voluntario = toModel(request);
        validar(voluntario);
        dao.inserir(voluntario);
        return voluntario;
    }

    public Voluntario atualizar(int id, VoluntarioRequest request) {
        buscarPorId(id);
        Voluntario voluntario = toModel(request);
        voluntario.setId(id);
        validar(voluntario);
        dao.atualizar(voluntario);
        return voluntario;
    }

    public void excluir(int id) {
        buscarPorId(id);
        dao.excluir(id);
    }

    private Voluntario toModel(VoluntarioRequest request) {
        Voluntario voluntario = new Voluntario();
        if (request != null) {
            voluntario.setNome(request.nome);
            voluntario.setUsuario(request.usuario);
            if (!isBlank(request.senha)) {
                voluntario.setSenha(SenhaHasher.gerarHash(request.senha));
            }
            voluntario.setAcessoSigilo(request.acessoSigilo != null && request.acessoSigilo);
            voluntario.setDisponivel(request.disponivel);
            if (request.especialidadeId != null) {
                Especialidade especialidade = new Especialidade();
                especialidade.setId(request.especialidadeId);
                voluntario.setEspecialidade(especialidade);
            }
        }
        return voluntario;
    }

    private void validar(Voluntario voluntario) {
        if (isBlank(voluntario.getNome())) {
            throw new BusinessException("Nome do voluntario e obrigatorio");
        }
        if (voluntario.getEspecialidade() != null && voluntario.getEspecialidade().getId() <= 0) {
            throw new BusinessException("ID da especialidade deve ser valido");
        }
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
