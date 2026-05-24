package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.MensagemBO;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.dto.MensagemResponse;
import br.com.tdbresponde.dto.PredictResponse; // Adicionado para a IA
import br.com.tdbresponde.model.Mensagem;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/mensagens")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MensagemResource {

    @Inject
    MensagemBO bo;

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        return Response.ok(MensagemResponse.from(bo.buscarPorId(id))).build();
    }

    @GET
    @Path("/atendimento/{atendimentoId}")
    public Response listarPorAtendimento(@PathParam("atendimentoId") int atendimentoId) {
        return Response.ok(bo.listarPorAtendimento(atendimentoId).stream()
                .map(MensagemResponse::from)
                .toList()).build();
    }

    /**
     * Método de inserção modificado para incluir a classificação da IA.
     * Mantém a persistência original e enriquece a resposta JSON.
     */
    @POST
    public Response inserir(MensagemRequest request) {
        // 1. Executa a lógica original de inserção no banco Oracle
        Mensagem mensagem = bo.inserir(request);

        // 2. Converte para o DTO de resposta original
        MensagemResponse response = MensagemResponse.from(mensagem);

        // 3. INTEGRAÇÃO: Chama o método de classificação que criamos no BO
        // Note: Se a IA falhar, o método retorna null e o sistema segue normalmente.
        PredictResponse predicao = bo.classificarMensagem(mensagem);

        // 4. Se a IA respondeu, preenchemos os novos campos do DTO
        if (predicao != null) {
            response.categoriaIA = predicao.categoriaPrevista;
            response.confiancaIA = predicao.confianca;
        }

        // 5. Retorna a resposta (agora com os dados da IA se disponíveis)
        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }
}
