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
import br.com.tdbresponde.security.AtendimentoAccess;
import br.com.tdbresponde.security.ChatMediaAccess;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext;

@Path("/atendimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AtendimentoResource {

    @Inject
    AtendimentoBO bo;

    @Inject
    MensagemBO mensagemBO;

    @Inject AtendimentoAccess access;
    @Inject ChatMediaAccess media;
    @Context SecurityContext identity;

    @GET
    public Response listar() {
        var permitido = access.consultaPermitida(identity);
        return Response.ok(access.listarConsultaveis(identity).stream()
                .filter(permitido)
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/solicitados")
    public Response listarSolicitados() {
        var permitido = access.consultaPermitida(identity);
        boolean admin = access.admin(identity);
        return Response.ok(bo.listarSolicitados().stream()
                .filter(a -> admin || (access.filaAberta(a) && permitido.test(a)))
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/voluntario/{voluntarioId}")
    public Response listarPorVoluntario(@PathParam("voluntarioId") int voluntarioId) {
        access.listarPorVoluntario(voluntarioId, identity);
        return Response.ok(bo.listarPorVoluntario(voluntarioId).stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/beneficiario/{beneficiarioId}")
    public Response listarPorBeneficiario(@PathParam("beneficiarioId") int beneficiarioId) {
        access.listarPorBeneficiario(beneficiarioId, identity);
        var permitido = access.consultaPermitida(identity);
        return Response.ok(bo.listarPorBeneficiario(beneficiarioId).stream()
                .filter(permitido)
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/beneficiario/conta/{contaId}")
    public Response listarPorContaBeneficiario(@PathParam("contaId") int contaId) {
        access.listarPorConta(contaId, identity);
        var permitido = access.consultaPermitida(identity);
        return Response.ok(bo.listarPorContaBeneficiario(contaId).stream()
                .filter(permitido)
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @POST
    @Path("/relatar")
    public Response relatar(RelatarSituacaoRequest request) {
        access.vincularRelato(request, identity);
        return Response.status(Response.Status.CREATED)
                .entity(bo.relatar(request))
                .build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Atendimento atendimento = access.consultar(id, identity);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @GET
    @Path("/{id}/previsao-ia")
    public Response buscarPrevisaoIA(@PathParam("id") int id) {
        access.conversar(id, identity);
        CheckinPrevisaoResponse previsao = bo.preverCheckinIA(id);
        if (previsao == null) {
            return Response.status(Response.Status.NO_CONTENT).build();
        }
        return Response.ok(previsao).build();
    }

    public Response listarMensagens(@PathParam("id") int id) {
        Atendimento autorizado = access.conversar(id, identity);
        return Response.ok(mensagemBO.listarPorAtendimento(autorizado).stream()
                .map(MensagemResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}/mensagens")
    public Response listarMensagens(@PathParam("id") int id,
            @jakarta.ws.rs.QueryParam("limite") Integer limite,
            @jakarta.ws.rs.QueryParam("antesId") Integer antesId) {
        if (limite == null && antesId == null) return listarMensagens(id);
        Atendimento autorizado = access.conversar(id, identity);
        return Response.ok(mensagemBO.listarPagina(autorizado, limite, antesId).stream()
                .map(MensagemResponse::from).toList()).build();
    }

    /**
     * Endpoint de inserção de mensagem via atendimento.
     */
    @POST
    @Path("/{id}/mensagens")
    public Response inserirMensagem(@PathParam("id") int id, MensagemRequest request) {
        if (request == null) {
            request = new MensagemRequest();
        }
        request.atendimentoId = id;
        Atendimento autorizado = access.conversar(id, identity);
        request.enviadoPor = access.remetente(identity);
        media.validarVinculo(request.arquivoUrl, id, identity);

        // 1. Salva a mensagem no banco (Lógica Original)
        br.com.tdbresponde.model.Mensagem mensagem = mensagemBO.inserir(request, autorizado);

        // 2. Converte para o DTO de resposta
        MensagemResponse response = MensagemResponse.from(mensagem);

        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @POST
    public Response inserir(AtendimentoRequest request) {
        access.exigirAdmin(identity);
        Atendimento atendimento = bo.inserir(request);
        return Response.status(Response.Status.CREATED)
                .entity(AtendimentoResponse.from(atendimento))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, AtendimentoRequest request) {
        Atendimento atual = access.alterar(id, identity);
        access.validarAtualizacao(atual, request, identity);
        Atendimento atendimento = bo.atualizar(id, request);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/status-prioridade")
    public Response atualizarStatusPrioridade(@PathParam("id") int id, AtendimentoAtualizacaoRequest request) {
        access.alterar(id, identity);
        Atendimento atendimento = bo.atualizarStatusPrioridade(id, request);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/encerrar")
    public Response encerrar(@PathParam("id") int id, EncerrarAtendimentoRequest request) {
        access.alterar(id, identity);
        Integer responsavel = access.responsavel(request != null ? request.voluntarioResponsavelId : null, identity);
        int responsavelId = responsavel != null ? responsavel : 0;
        Atendimento atendimento = bo.encerrar(id, responsavelId);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/assumir")
    public Response assumir(@PathParam("id") int id, AssumirAtendimentoRequest request) {
        access.consultar(id, identity);
        Integer voluntarioId = access.responsavel(request != null ? request.voluntarioId : null, identity);
        Atendimento atendimento = bo.assumir(id, voluntarioId);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @PUT
    @Path("/{id}/checkin")
    public Response atualizarCheckin(@PathParam("id") int id, CheckinRequest request) {
        access.alterar(id, identity);
        CheckinPrevisaoResponse[] holder = new CheckinPrevisaoResponse[1];
        Atendimento atendimento = bo.atualizarCheckinComPrevisao(id, request, holder);
        CheckinPrevisaoResponse previsao = holder[0];
        String prevStr = previsao != null ? previsao.previsaoCheckin : null;
        Double conf = previsao != null ? previsao.confiancaCheckin : null;
        String just = previsao != null ? previsao.justificativaCheckin : null;
        return Response.ok(AtendimentoResponse.from(atendimento, prevStr, conf, just)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        access.alterar(id, identity);
        bo.excluir(id);
        return Response.noContent().build();
    }
}
