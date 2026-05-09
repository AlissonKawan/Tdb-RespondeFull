package resource;

import dao.CanalComunicacaoDAO;
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
import model.CanalComunicacao;

@Path("/canais")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CanalComunicacaoResource {

    private final CanalComunicacaoDAO dao = new CanalComunicacaoDAO();

    @GET
    public Response listar() {
        return Response.ok(dao.buscarTodos()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        CanalComunicacao canal = dao.buscarPorId(id);
        if (canal == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(canal).build();
    }

    @POST
    public Response inserir(CanalComunicacao canal) {
        dao.inserir(canal);
        return Response.status(Response.Status.CREATED).entity(canal).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, CanalComunicacao canal) {
        canal.setId(id);
        dao.atualizar(canal);
        return Response.ok(canal).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        dao.excluir(id);
        return Response.noContent().build();
    }
}
