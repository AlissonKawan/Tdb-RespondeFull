package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ContatoBO;
import br.com.tdbresponde.dto.MensagemContatoRequest;
import br.com.tdbresponde.model.MensagemContato;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/contato")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ContatoResource {

    @Inject
    ContatoBO bo;

    @POST
    public Response registrarMensagem(MensagemContatoRequest request) {
        MensagemContato mensagem = bo.registrarMensagem(request);
        return Response.status(Response.Status.CREATED).entity(mensagem).build();
    }

    @GET
    public Response listar() {
        List<MensagemContato> mensagens = bo.listar();
        return Response.ok(mensagens).build();
    }

    @PUT
    @Path("/reclassificar")
    public Response reclassificarTodas() {
        bo.reclassificarTodas();
        return Response.ok("{\"mensagem\": \"Mensagens reclassificadas com sucesso!\"}").build();
    }
}
