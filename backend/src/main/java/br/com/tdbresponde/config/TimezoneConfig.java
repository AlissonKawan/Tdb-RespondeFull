package br.com.tdbresponde.config;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

import java.util.TimeZone;

@ApplicationScoped
public class TimezoneConfig {

    void onStart(@Observes StartupEvent ev) {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
        System.out.println("Timezone global configurado para America/Sao_Paulo");
    }
}
