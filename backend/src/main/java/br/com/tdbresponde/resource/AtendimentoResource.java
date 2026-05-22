package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.AtendimentoBO;
import br.com.tdbresponde.bo.MensagemBO;
import br.com.tdbresponde.dto.AtendimentoAtualizacaoRequest;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.dto.AtendimentoResponse;
import br.com.tdbresponde.dto.AssumirAtendimentoRequest;
import br.com.tdbresponde.dto.CheckinRequest;
import br.com.tdbresponde.dto.EncerrarAtendimentoRequest;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.dto.MensagemResponse;
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

    @GET
    @Path("/voluntario/{voluntarioId}")
    public Response listarPorVoluntario(@PathParam("voluntarioId") int voluntarioId) {
        return Response.ok(bo.listarPorVoluntario(voluntarioId).stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/beneficiario/{beneficiarioId}")
    public Response listarPorBeneficiario(@PathParam("beneficiarioId") int beneficiarioId) {
        return Response.ok(bo.listarPorBeneficiario(beneficiarioId).stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/beneficiario/conta/{contaId}")
    public Response listarPorContaBeneficiario(@PathParam("contaId") int contaId) {
        return Response.ok(bo.listarPorContaBeneficiario(contaId).stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/em-andamento")
    public Response listarEmAndamento() {
        return Response.ok(bo.listarEmAndamento().stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/encerrados")
    public Response listarEncerrados() {
        return Response.ok(bo.listarEncerrados().stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @POST
    @Path("/solicitar")
    public Response solicitar(SolicitarAtendimentoRequest request) {
        Atendimento atendimento = bo.solicitar(request);
        return Response.status(Response.Status.CREATED)
                .entity(AtendimentoResponse.from(atendimento))
                .build();
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
        Atendimento atendimento = bo.buscarPorId(id);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @GET
    @Path("/{id}/mensagens")
    public Response listarMensagens(@PathParam("id") int id) {
        return Response.ok(mensagemBO.listarPorAtendimento(id).stream()
                .map(MensagemResponse::from)
                .toList()).build();
    }

    @POST
    @Path("/{id}/mensagens")
    public Response inserirMensagem(@PathParam("id") int id, MensagemRequest request) {
        if (request == null) {
            request = new MensagemRequest();
        }
        request.atendimentoId = id;
        return Response.status(Response.Status.CREATED)
                .entity(MensagemResponse.from(mensagemBO.inserir(request)))
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
        Atendimento atendimento = bo.atualizarCheckin(id, request);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        bo.excluir(id);
        return Response.noContent().build();
    }
}
