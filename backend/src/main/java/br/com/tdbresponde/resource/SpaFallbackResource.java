package br.com.tdbresponde.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.InternalServerErrorException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Path("/")
public class SpaFallbackResource {

    @GET
    @Path("/login")
    @Produces(MediaType.TEXT_HTML)
    public Response login() {
        return index();
    }

    @GET
    @Path("/cadastro-beneficiario")
    @Produces(MediaType.TEXT_HTML)
    public Response cadastroBeneficiario() {
        return index();
    }

    @GET
    @Path("/cadastro-voluntario")
    @Produces(MediaType.TEXT_HTML)
    public Response cadastroVoluntario() {
        return index();
    }

    @GET
    @Path("/cadastro")
    @Produces(MediaType.TEXT_HTML)
    public Response cadastro() {
        return index();
    }

    @GET
    @Path("/portal-beneficiario")
    @Produces(MediaType.TEXT_HTML)
    public Response portalBeneficiario() {
        return index();
    }

    @GET
    @Path("/portal-voluntario")
    @Produces(MediaType.TEXT_HTML)
    public Response portalVoluntario() {
        return index();
    }

    @GET
    @Path("/portal")
    @Produces(MediaType.TEXT_HTML)
    public Response portal() {
        return index();
    }

    @GET
    @Path("/portal/beneficiario")
    @Produces(MediaType.TEXT_HTML)
    public Response portalBeneficiarioAninhado() {
        return index();
    }

    @GET
    @Path("/portal/voluntario")
    @Produces(MediaType.TEXT_HTML)
    public Response portalVoluntarioAninhado() {
        return index();
    }

    @GET
    @Path("/beneficiario/solicitar-atendimento")
    @Produces(MediaType.TEXT_HTML)
    public Response solicitarAtendimento() {
        return index();
    }

    @GET
    @Path("/atendimentos/{id:\\d+}")
    @Produces(MediaType.TEXT_HTML)
    public Response detalheAtendimento(@PathParam("id") int id) {
        return index();
    }

    @GET
    @Path("/sobre")
    @Produces(MediaType.TEXT_HTML)
    public Response sobre() {
        return index();
    }

    @GET
    @Path("/faq")
    @Produces(MediaType.TEXT_HTML)
    public Response faq() {
        return index();
    }

    @GET
    @Path("/contato")
    @Produces(MediaType.TEXT_HTML)
    public Response contato() {
        return index();
    }

    @GET
    @Path("/integrantes")
    @Produces(MediaType.TEXT_HTML)
    public Response integrantes() {
        return index();
    }

    @GET
    @Path("/solucao")
    @Produces(MediaType.TEXT_HTML)
    public Response solucao() {
        return index();
    }

    @GET
    @Path("/roadmap")
    @Produces(MediaType.TEXT_HTML)
    public Response roadmap() {
        return index();
    }

    private Response index() {
        try (InputStream stream = Thread.currentThread()
                .getContextClassLoader()
                .getResourceAsStream("META-INF/resources/index.html")) {

            if (stream == null) {
                throw new InternalServerErrorException("index.html nao encontrado");
            }

            String html = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            return Response.ok(html, MediaType.TEXT_HTML_TYPE).build();
        } catch (IOException e) {
            throw new InternalServerErrorException("Nao foi possivel carregar index.html", e);
        }
    }
}
