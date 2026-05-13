package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.MensagemBO;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.dto.MensagemResponse;
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

    @POST
    public Response inserir(MensagemRequest request) {
        Mensagem mensagem = bo.inserir(request);
        return Response.status(Response.Status.CREATED)
                .entity(MensagemResponse.from(mensagem))
                .build();
    }
}
