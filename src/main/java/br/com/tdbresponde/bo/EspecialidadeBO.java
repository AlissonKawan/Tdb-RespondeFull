package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.EspecialidadeDAO;
import br.com.tdbresponde.dto.EspecialidadeRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.model.Especialidade;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class EspecialidadeBO {

    @Inject
    EspecialidadeDAO dao;

    public List<Especialidade> listar() {
        return dao.buscarTodos();
    }

    public Especialidade buscarPorId(int id) {
        Especialidade especialidade = dao.buscarPorId(id);
        if (especialidade == null) {
            throw new NotFoundException("Especialidade nao encontrada");
        }
        return especialidade;
    }

    public Especialidade inserir(EspecialidadeRequest request) {
        Especialidade especialidade = toModel(request);
        validar(especialidade);
        dao.inserir(especialidade);
        return especialidade;
    }

    public Especialidade atualizar(int id, EspecialidadeRequest request) {
        buscarPorId(id);
        Especialidade especialidade = toModel(request);
        especialidade.setId(id);
        validar(especialidade);
        dao.atualizar(especialidade);
        return especialidade;
    }

    public void excluir(int id) {
        buscarPorId(id);
        dao.excluir(id);
    }

    private Especialidade toModel(EspecialidadeRequest request) {
        Especialidade especialidade = new Especialidade();
        if (request != null) {
            especialidade.setNome(request.nome);
            especialidade.setDescricao(request.descricao);
        }
        return especialidade;
    }

    private void validar(Especialidade especialidade) {
        if (isBlank(especialidade.getNome())) {
            throw new BusinessException("Nome da especialidade e obrigatorio");
        }
        if (isBlank(especialidade.getDescricao())) {
            throw new BusinessException("Descricao da especialidade e obrigatoria");
        }
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
