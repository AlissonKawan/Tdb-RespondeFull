package resource;

import dao.AtendimentoDAO;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import model.Atendimento;

@Path("/atendimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AtendimentoResource {

    private final AtendimentoDAO dao = new AtendimentoDAO();

    @GET
    public Response listar() {
        return Response.ok(dao.buscarTodos()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Atendimento atendimento = dao.buscarPorId(id);
        if (atendimento == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(atendimento).build();
    }

    @POST
    public Response inserir(Atendimento atendimento) {
        dao.inserir(atendimento);
        return Response.status(Response.Status.CREATED).entity(atendimento).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, Atendimento atendimento) {
        atendimento.setId(id);
        dao.atualizar(atendimento);
        return Response.ok(atendimento).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        dao.excluir(id);
        return Response.noContent().build();
    }
}
