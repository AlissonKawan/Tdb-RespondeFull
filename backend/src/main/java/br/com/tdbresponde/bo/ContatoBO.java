package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.MensagemContatoDAO;
import br.com.tdbresponde.dto.MensagemContatoRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.MensagemContato;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class ContatoBO {
    

    @Inject
    MensagemContatoDAO dao;


    public MensagemContato registrarMensagem(MensagemContatoRequest request) {
        if (request == null || request.nome == null || request.nome.trim().isEmpty() ||
            request.email == null || request.email.trim().isEmpty() ||
            request.mensagem == null || request.mensagem.trim().isEmpty()) {
            throw new BusinessException("Nome, email e mensagem sao obrigatorios.");
        }

        MensagemContato mensagem = new MensagemContato();
        mensagem.setNome(request.nome.trim());
        mensagem.setEmail(request.email.trim());
        mensagem.setMensagem(request.mensagem.trim());
        mensagem.setLida(false);

        dao.inserir(mensagem);
        return mensagem;
    }

    public List<MensagemContato> listar() {
        return dao.listar();
    }

    public void apagarTodasMensagens() {
        dao.apagarTodos();
    }
}
