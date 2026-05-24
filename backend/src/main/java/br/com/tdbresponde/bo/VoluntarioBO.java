package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.dto.VoluntarioRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.security.SenhaHasher;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class VoluntarioBO {

    @Inject
    VoluntarioDAO dao;

    @Inject
    ContaUsuarioDAO contaUsuarioDAO;

    public List<Voluntario> listar() {
        return dao.buscarTodos();
    }

    public List<Voluntario> listarAtivos() {
        return dao.buscarAtivos();
    }

    public List<Voluntario> listarPendentes() {
        return dao.buscarPendentes();
    }

    public List<Voluntario> buscarTopRanking(int limite) {
        return dao.buscarTopRanking(limite);
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
        voluntario.setStatusAprovacao("PENDENTE");
        validar(voluntario);
        dao.inserir(voluntario);
        return voluntario;
    }

    public Voluntario atualizar(int id, VoluntarioRequest request) {
        Voluntario atual = buscarPorId(id);
        Voluntario voluntario = toModel(request);
        voluntario.setId(id);
        voluntario.setStatusAprovacao(atual.getStatusAprovacao());
        if (isBlank(voluntario.getSenha())) {
            voluntario.setSenha(atual.getSenha());
        }
        if (voluntario.getContaId() == null) {
            voluntario.setContaId(atual.getContaId());
        }
        if (isBlank(voluntario.getMotivoVoluntariado())) {
            voluntario.setMotivoVoluntariado(atual.getMotivoVoluntariado());
        }
        validar(voluntario);
        dao.atualizar(voluntario);
        return voluntario;
    }

    public void aprovar(int id) {
        Voluntario voluntario = buscarPorId(id);

        if (voluntario.getContaId() == null) {
            throw new BusinessException("Voluntario nao possui conta vinculada.");
        }

        dao.aprovar(id);
        contaUsuarioDAO.ativar(voluntario.getContaId());

        if (voluntario.getIdVoluntarioIndicador() != null) {
            Voluntario indicador = dao.buscarPorId(voluntario.getIdVoluntarioIndicador());
            if (indicador != null) {
                int pontosAtuais = indicador.getPontosIndicacao() != null ? indicador.getPontosIndicacao() : 0;
                indicador.setPontosIndicacao(pontosAtuais + 10);
                dao.atualizar(indicador);
            }
        }
    }

    public void excluir(int id) {
        buscarPorId(id);
        dao.excluir(id);
    }

    public Voluntario gerarCodigoIndicacao(int id) {
        Voluntario voluntario = buscarPorId(id);
        if (voluntario.getCodigoIndicacao() != null && !voluntario.getCodigoIndicacao().trim().isEmpty()) {
            return voluntario; // ja possui
        }
        
        String codigo = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        voluntario.setCodigoIndicacao(codigo);
        dao.atualizar(voluntario);
        return voluntario;
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
            voluntario.setContaId(request.contaId);
            voluntario.setMotivoVoluntariado(request.motivoVoluntariado);
            voluntario.setEspecialidades(criarEspecialidades(request.especialidadeIds, request.especialidadeId));
            if (!voluntario.getEspecialidades().isEmpty()) {
                voluntario.setEspecialidade(voluntario.getEspecialidades().get(0));
            }
        }
        return voluntario;
    }

    private List<Especialidade> criarEspecialidades(List<Integer> ids, Integer idLegado) {
        List<Integer> todosIds = new ArrayList<>();
        if (ids != null) {
            todosIds.addAll(ids);
        }
        if (idLegado != null && !todosIds.contains(idLegado)) {
            todosIds.add(idLegado);
        }

        return todosIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .map(id -> {
                    Especialidade especialidade = new Especialidade();
                    especialidade.setId(id);
                    return especialidade;
                })
                .toList();
    }

    private void validar(Voluntario voluntario) {
        if (isBlank(voluntario.getNome())) {
            throw new BusinessException("Nome do voluntario e obrigatorio");
        }
        for (Especialidade especialidade : voluntario.getEspecialidades()) {
            if (especialidade == null || especialidade.getId() <= 0) {
                throw new BusinessException("IDs das especialidades devem ser validos");
            }
        }
        if (isBlank(voluntario.getStatusAprovacao())) {
            throw new BusinessException("Status de aprovacao do voluntario e obrigatorio");
        }
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
