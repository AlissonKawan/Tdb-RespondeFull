package br.com.tdbresponde.client;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class CroVerificationServiceProducer {

    @ConfigProperty(name = "tdbresponde.cro.verification.mode", defaultValue = "mock")
    String mode;

    @ConfigProperty(name = "tdbresponde.cro.verification.url", defaultValue = "https://busca-profissionais.cfo.org.br/")
    String url;

    @ConfigProperty(name = "tdbresponde.cro.verification.strict", defaultValue = "false")
    boolean strict;

    @Produces
    @ApplicationScoped
    public CroVerificationService produceCroService() {
        if ("real".equalsIgnoreCase(mode) || "gov".equalsIgnoreCase(mode)) {
            return new GovCroVerificationService(url, strict);
        }
        return new MockCroVerificationService();
    }
}
