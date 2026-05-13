package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.CanalComunicacaoDAO;
import br.com.tdbresponde.dto.CanalComunicacaoRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.model.CanalComunicacao;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class CanalComunicacaoBO {

    @Inject
    CanalComunicacaoDAO dao;

    public List<CanalComunicacao> listar() {
        return dao.buscarTodos();
    }

    public CanalComunicacao buscarPorId(int id) {
        CanalComunicacao canal = dao.buscarPorId(id);
        if (canal == null) {
            throw new NotFoundException("Canal de comunicacao nao encontrado");
        }
        return canal;
    }

    public CanalComunicacao inserir(CanalComunicacaoRequest request) {
        CanalComunicacao canal = toModel(request);
        validar(canal);
        dao.inserir(canal);
        return canal;
    }

    public CanalComunicacao atualizar(int id, CanalComunicacaoRequest request) {
        buscarPorId(id);
        CanalComunicacao canal = toModel(request);
        canal.setId(id);
        validar(canal);
        dao.atualizar(canal);
        return canal;
    }

    public void excluir(int id) {
        buscarPorId(id);
        dao.excluir(id);
    }

    private CanalComunicacao toModel(CanalComunicacaoRequest request) {
        CanalComunicacao canal = new CanalComunicacao();
        if (request != null) {
            canal.setNome(request.nome);
            canal.setDescricao(request.descricao);
        }
        return canal;
    }

    private void validar(CanalComunicacao canal) {
        if (isBlank(canal.getNome())) {
            throw new BusinessException("Nome do canal de comunicacao e obrigatorio");
        }
        if (isBlank(canal.getDescricao())) {
            throw new BusinessException("Descricao do canal de comunicacao e obrigatoria");
        }
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
