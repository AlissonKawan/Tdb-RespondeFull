package br.com.tdbresponde.dto;

import br.com.tdbresponde.model.Voluntario;

public class RankingResponse {

    public String nome;
    public String codigoIndicacao;
    public Integer pontosIndicacao;
    public EspecialidadeResponse especialidade;

    public static RankingResponse from(Voluntario voluntario) {
        RankingResponse response = new RankingResponse();
        response.nome = voluntario.getNome();
        response.codigoIndicacao = voluntario.getCodigoIndicacao();
        response.pontosIndicacao = voluntario.getPontosIndicacao();
        if (voluntario.getEspecialidade() != null) {
            response.especialidade = EspecialidadeResponse.from(voluntario.getEspecialidade());
        }
        return response;
    }
}
