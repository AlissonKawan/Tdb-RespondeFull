package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.MensagemBO;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.dto.MensagemResponse;
import br.com.tdbresponde.model.Mensagem;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.security.AtendimentoAccess;
import br.com.tdbresponde.security.ChatMediaAccess;
import br.com.tdbresponde.exception.BusinessException;
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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext;
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

    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "webm", "mp3", "mp4");

    @Inject
    MensagemBO bo;
    @Inject AtendimentoAccess access;
    @Inject ChatMediaAccess media;
    @Context SecurityContext identity;

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Mensagem mensagem = bo.buscarPorId(id);
        access.conversar(mensagem.getAtendimento().getId(), identity);
        return Response.ok(MensagemResponse.from(mensagem)).build();
    }

    @GET
    @Path("/atendimento/{atendimentoId}")
    public Response listarPorAtendimento(@PathParam("atendimentoId") int atendimentoId) {
        Atendimento autorizado = access.conversar(atendimentoId, identity);
        return Response.ok(bo.listarPorAtendimento(autorizado).stream()
                .map(MensagemResponse::from)
                .toList()).build();
    }

    @POST
    public Response inserir(MensagemRequest request) {
        if (request == null || request.atendimentoId == null) throw new BusinessException("Informe o atendimento da mensagem");
        Atendimento autorizado = access.conversar(request.atendimentoId, identity);
        request.enviadoPor = access.remetente(identity);
        media.validarVinculo(request.arquivoUrl, request.atendimentoId, identity);
        Mensagem mensagem = bo.inserir(request, autorizado);

        MensagemResponse response = MensagemResponse.from(mensagem);

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @POST
    @Path("/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response upload(@RestForm("file") FileUpload arquivo, @RestForm("atendimentoId") Integer atendimentoId) {
        if (atendimentoId == null) throw new BusinessException("Informe o atendimento do arquivo");
        access.conversar(atendimentoId, identity);
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

        String nomeArquivo = atendimentoId + "-" + UUID.randomUUID() + "." + extensao;
        java.nio.file.Path destino = media.arquivo(nomeArquivo);

        try {
            Files.createDirectories(destino.getParent());
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
        java.nio.file.Path arquivo = media.arquivo(nomeArquivo);
        media.autorizarLeitura(nomeArquivo, identity);
        if (!Files.isRegularFile(arquivo)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        String extensao = nomeArquivo.substring(nomeArquivo.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        StreamingOutput stream = output -> Files.copy(arquivo, output);
        return Response.ok(stream)
                .type(mimeTypeSeguro(null, extensao))
                .header("Content-Disposition", "inline; filename=\"" + nomeArquivo + "\"")
                .header("Cache-Control", "no-store")
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
