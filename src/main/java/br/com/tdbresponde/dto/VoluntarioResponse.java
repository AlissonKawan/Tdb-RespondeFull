package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Voluntario;

public class VoluntarioResponse {

    public int id;
    public String nome;
    public String usuario;
    public Boolean acessoSigilo;
    public boolean disponivel;
    public EspecialidadeResponse especialidade;

    public static VoluntarioResponse from(Voluntario voluntario) {
        VoluntarioResponse response = new VoluntarioResponse();
        response.id = voluntario.getId();
        response.nome = voluntario.getNome();
        response.usuario = voluntario.getUsuario();
        response.acessoSigilo = voluntario.getAcessoSigilo();
        response.disponivel = voluntario.isDisponivel();
        if (voluntario.getEspecialidade() != null) {
            response.especialidade = EspecialidadeResponse.from(voluntario.getEspecialidade());
        }
        return response;
    }
}
