package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.AtendimentoBO;
import br.com.tdbresponde.bo.MensagemBO;
import br.com.tdbresponde.dto.AtendimentoAtualizacaoRequest;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.dto.AtendimentoResponse;
import br.com.tdbresponde.dto.AssumirAtendimentoRequest;
import br.com.tdbresponde.dto.CheckinPrevisaoResponse;
import br.com.tdbresponde.dto.CheckinRequest;
import br.com.tdbresponde.dto.EncerrarAtendimentoRequest;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.dto.MensagemResponse;
import br.com.tdbresponde.dto.PredictResponse; // Adicionado para a IA
import br.com.tdbresponde.dto.RelatarSituacaoRequest;
import br.com.tdbresponde.dto.SolicitarAtendimentoRequest;
import jakarta.inject.Inject;
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
import br.com.tdbresponde.model.Atendimento;

@Path("/atendimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AtendimentoResource {

    @Inject
    AtendimentoBO bo;

    @Inject
    MensagemBO mensagemBO;

    @GET
    public Response listar() {
        return Response.ok(bo.listar().stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/solicitados")
    public Response listarSolicitados() {
        return Response.ok(bo.listarSolicitados().stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @POST
    @Path("/relatar")
    public Response relatar(RelatarSituacaoRequest request) {
        return Response.status(Response.Status.CREATED)
                .entity(bo.relatar(request))
                .build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        CheckinPrevisaoResponse[] holder = new CheckinPrevisaoResponse[1];
        Atendimento atendimento = bo.buscarPorIdComPrevisao(id, holder);
        CheckinPrevisaoResponse previsao = holder[0];
        String prevStr = previsao != null ? previsao.previsaoCheckin : null;
        Double conf = previsao != null ? previsao.confiancaCheckin : null;
        return Response.ok(AtendimentoResponse.from(atendimento, prevStr, conf)).build();
    }

    @GET
    @Path("/{id}/mensagens")
    public Response listarMensagens(@PathParam("id") int id) {
        return Response.ok(mensagemBO.listarPorAtendimento(id).stream()
                .map(MensagemResponse::from)
                .toList()).build();
    }

    /**
     * Endpoint de inserção de mensagem via atendimento.
     * Modificado para chamar a IA do Python e classificar o conteúdo.
     */
    @POST
    @Path("/{id}/mensagens")
    public Response inserirMensagem(@PathParam("id") int id, MensagemRequest request) {
        if (request == null) {
            request = new MensagemRequest();
        }
        request.atendimentoId = id;

        // 1. Salva a mensagem no banco (Lógica Original)
        br.com.tdbresponde.model.Mensagem mensagem = mensagemBO.inserir(request);

        // 2. Converte para o DTO de resposta
        MensagemResponse response = MensagemResponse.from(mensagem);

        // 3. INTEGRAÇÃO: Chama a IA para classificar a mensagem recém-criada
        PredictResponse predicao = mensagemBO.classificarMensagem(mensagem);

        // 4. Se a IA respondeu, preenchemos os campos de classificação na resposta
        if (predicao != null) {
            response.categoriaIA = predicao.categoriaPrevista;
            response.confiancaIA = predicao.confianca;
        }

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @POST
    public Response inserir(AtendimentoRequest request) {
        Atendimento atendimento = bo.inserir(request);
        return Response.status(Response.Status.CREATED)
                .entity(AtendimentoResponse.from(atendimento))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, AtendimentoRequest request) {
        Atendimento atendimento = bo.atualizar(id, request);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/status-prioridade")
    public Response atualizarStatusPrioridade(@PathParam("id") int id, AtendimentoAtualizacaoRequest request) {
        Atendimento atendimento = bo.atualizarStatusPrioridade(id, request);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/encerrar")
    public Response encerrar(@PathParam("id") int id, EncerrarAtendimentoRequest request) {
        int responsavelId = request != null && request.voluntarioResponsavelId != null
                ? request.voluntarioResponsavelId
                : 0;
        Atendimento atendimento = bo.encerrar(id, responsavelId);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/assumir")
    public Response assumir(@PathParam("id") int id, AssumirAtendimentoRequest request) {
        Integer voluntarioId = request != null ? request.voluntarioId : null;
        Atendimento atendimento = bo.assumir(id, voluntarioId);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/checkin")
    public Response atualizarCheckin(@PathParam("id") int id, CheckinRequest request) {
        CheckinPrevisaoResponse[] holder = new CheckinPrevisaoResponse[1];
        Atendimento atendimento = bo.atualizarCheckinComPrevisao(id, request, holder);
        CheckinPrevisaoResponse previsao = holder[0];
        String prevStr = previsao != null ? previsao.previsaoCheckin : null;
        Double conf = previsao != null ? previsao.confiancaCheckin : null;
        return Response.ok(AtendimentoResponse.from(atendimento, prevStr, conf)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        bo.excluir(id);
        return Response.noContent().build();
    }
}
