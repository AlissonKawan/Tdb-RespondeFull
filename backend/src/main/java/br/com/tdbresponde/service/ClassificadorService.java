package br.com.tdbresponde.service;

import br.com.tdbresponde.dto.PredictRequest;
import br.com.tdbresponde.dto.PredictResponse;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

// Define que esta interface é um cliente REST que usará a URL configurada
@RegisterRestClient(configKey = "classificador-api")
@Path("/") // Caminho base da API
public interface ClassificadorService {

    // Define que faremos um POST para o endpoint /predict
    @POST
    @Path("/predict")
    // Define que enviaremos e receberemos dados no formato JSON
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    PredictResponse classificar(PredictRequest request);
}
