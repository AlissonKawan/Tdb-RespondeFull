package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Voluntario;

public class VoluntarioResponse {

    public int id;
    public String nome;
    public String usuario;
    public Boolean acessoSigilo;
    public boolean disponivel;
    public String statusAprovacao;
    public String motivoVoluntariado;
    public Integer contaId;
    public String codigoIndicacao;
    public Integer pontosIndicacao;
    public Integer idVoluntarioIndicador;
    public EspecialidadeResponse especialidade;
    public java.util.List<EspecialidadeResponse> especialidades;
    public String cro;
    public String ufCro;
    public String statusCro;

    public static VoluntarioResponse from(Voluntario voluntario) {
        VoluntarioResponse response = new VoluntarioResponse();
        response.id = voluntario.getId();
        response.nome = voluntario.getNome();
        response.usuario = voluntario.getUsuario();
        response.acessoSigilo = voluntario.getAcessoSigilo();
        response.disponivel = voluntario.isDisponivel();
        response.statusAprovacao = voluntario.getStatusAprovacao();
        response.motivoVoluntariado = voluntario.getMotivoVoluntariado();
        response.contaId = voluntario.getContaId();
        response.codigoIndicacao = voluntario.getCodigoIndicacao();
        response.pontosIndicacao = voluntario.getPontosIndicacao();
        response.idVoluntarioIndicador = voluntario.getIdVoluntarioIndicador();
        response.cro = voluntario.getCro();
        response.ufCro = voluntario.getUfCro();
        response.statusCro = voluntario.getStatusCro();
        if (voluntario.getEspecialidade() != null) {
            response.especialidade = EspecialidadeResponse.from(voluntario.getEspecialidade());
        }
        response.especialidades = voluntario.getEspecialidades().stream()
                .map(EspecialidadeResponse::from)
                .toList();
        return response;
    }
}
