package br.com.tdbresponde.bo;
import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dto.*;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ApoloniaAberturaTest {
 AtendimentoBO bo; AtendimentoDAO dao;
 @BeforeEach void setup(){ bo=new AtendimentoBO(); dao=mock(AtendimentoDAO.class); bo.atendimentoDAO=dao; }
 RelatarSituacaoRequest request(){var r=new RelatarSituacaoRequest();r.descricao="  Preciso de apoio odontológico.  ";return r;}
 @Test void abreComDescricaoSemTriagem(){var r=request();doAnswer(i->{Atendimento a=i.getArgument(1);assertNull(a.getPrioridade());assertEquals("Preciso de apoio odontológico.",a.getDescricao());var p=new MulherApolonia();p.setId(20);a.setPessoaAtendida(p);return null;}).when(dao).abrirApolonia(eq(7),any());bo.relatarApolonia(7,r);verify(dao).abrirApolonia(eq(7),any());}
 @Test void rejeitaAusenciaEDescricaoCurta(){assertThrows(BusinessException.class,()->bo.relatarApolonia(7,null));var r=request();r.descricao="   ";assertThrows(BusinessException.class,()->bo.relatarApolonia(7,r));r.descricao="x".repeat(4001);assertThrows(BusinessException.class,()->bo.relatarApolonia(7,r));verifyNoInteractions(dao);}
 @Test void rejeitaForja(){var outra=request();outra.idContaBeneficiario=8;assertThrows(BusinessException.class,()->bo.relatarApolonia(7,outra));var tipo=request();tipo.tipo="CRIANCA_ADOLESCENTE";assertThrows(BusinessException.class,()->bo.relatarApolonia(7,tipo));var risco=request();risco.nivelRisco=3;assertThrows(BusinessException.class,()->bo.relatarApolonia(7,risco));var prioridade=request();prioridade.prioridade=1;assertThrows(BusinessException.class,()->bo.relatarApolonia(7,prioridade));verifyNoInteractions(dao);}
 @Test void riscoAusenteNaoCalculaPrioridade(){assertNull(bo.calcularPrioridade(new MulherApolonia()));}
 @Test void beneficiariaNaoRecebeTriagem(){var a=new Atendimento();a.setPrioridade(1);var p=new MulherApolonia();p.setNivelRisco(5);a.setPessoaAtendida(p);assertNull(AtendimentoResponse.paraBeneficiario(a).prioridade);assertNull(AtendimentoResponse.paraBeneficiario(a).gravidade);}
 @Test void projecaoNaoInventaGravidade(){var a=new Atendimento();a.setPessoaAtendida(new PessoaAtendidaBase());assertNull(AtendimentoResponse.from(a).gravidade);assertNull(AtendimentoResponse.from(a).prioridade);}
}
