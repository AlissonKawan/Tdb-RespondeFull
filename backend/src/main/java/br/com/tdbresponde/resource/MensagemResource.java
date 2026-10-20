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
import jakarta.ws.rs.core.StreamingOutput;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Path("/mensagens")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MensagemResource {

    private static final java.nio.file.Path UPLOAD_DIR = java.nio.file.Path.of("uploads", "chat")
            .toAbsolutePath().normalize();
    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "webm", "mp3", "mp4");

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

        MensagemResponse response = MensagemResponse.from(mensagem);

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @POST
    @Path("/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response upload(@RestForm("file") FileUpload arquivo) {
        if (arquivo == null || arquivo.fileName() == null || arquivo.fileName().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("mensagem", "Selecione uma foto ou um audio para enviar."))
                    .build();
        }

        String extensao = extensaoPermitida(arquivo.fileName());
        if (extensao == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("mensagem", "Formato nao permitido. Use JPG, PNG, WEBM, MP3 ou MP4."))
                    .build();
        }

        String mimeType = mimeTypeSeguro(arquivo.contentType(), extensao);
        if (!mimeType.startsWith("image/") && !mimeType.startsWith("audio/")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("mensagem", "O arquivo deve ser uma foto ou um audio."))
                    .build();
        }

        String nomeArquivo = UUID.randomUUID() + "." + extensao;
        java.nio.file.Path destino = UPLOAD_DIR.resolve(nomeArquivo).normalize();

        try {
            Files.createDirectories(UPLOAD_DIR);
            Files.copy(arquivo.uploadedFile(), destino, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            return Response.serverError()
                    .entity(Map.of("mensagem", "Nao foi possivel salvar o arquivo enviado."))
                    .build();
        }

        return Response.status(Response.Status.CREATED)
                .entity(Map.of(
                        "arquivoUrl", "/mensagens/midia/" + nomeArquivo,
                        "mimeType", mimeType))
                .build();
    }

    @GET
    @Path("/midia/{nomeArquivo}")
    @Produces({"image/jpeg", "image/png", "audio/webm", "audio/mpeg", "audio/mp4"})
    public Response buscarMidia(@PathParam("nomeArquivo") String nomeArquivo) {
        if (nomeArquivo == null || !nomeArquivo.matches("[0-9a-fA-F-]{36}\\.(jpg|jpeg|png|webm|mp3|mp4)")) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        java.nio.file.Path arquivo = UPLOAD_DIR.resolve(nomeArquivo).normalize();
        if (!arquivo.startsWith(UPLOAD_DIR) || !Files.isRegularFile(arquivo)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        String extensao = nomeArquivo.substring(nomeArquivo.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        StreamingOutput stream = output -> Files.copy(arquivo, output);
        return Response.ok(stream)
                .type(mimeTypeSeguro(null, extensao))
                .header("Content-Disposition", "inline; filename=\"" + nomeArquivo + "\"")
                .header("Cache-Control", "private, max-age=3600")
                .header("X-Content-Type-Options", "nosniff")
                .build();
    }

    private String extensaoPermitida(String nomeOriginal) {
        int separador = nomeOriginal.lastIndexOf('.');
        if (separador < 0 || separador == nomeOriginal.length() - 1) return null;
        String extensao = nomeOriginal.substring(separador + 1).toLowerCase(Locale.ROOT);
        return EXTENSOES_PERMITIDAS.contains(extensao) ? extensao : null;
    }

    private String mimeTypeSeguro(String informado, String extensao) {
        return switch (extensao) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webm" -> "audio/webm";
            case "mp3" -> "audio/mpeg";
            case "mp4" -> "audio/mp4";
            default -> informado == null || informado.isBlank() ? MediaType.APPLICATION_OCTET_STREAM : informado;
        };
    }
}
