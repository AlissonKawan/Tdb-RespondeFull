package test;

import model.Especialidade;
import model.Voluntario;

public class TesteVoluntario {
    public static void main(String[] args) {

        Especialidade esp = new Especialidade(1, "Tratamento bucal gratuito", "Odontologia");

        Voluntario v1 = new Voluntario(1, "Dra. Maria Silva", "João Santos", "123456", true, true, esp);

        System.out.println(v1);
    }
}
