import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SolicitarAtendimento from '../SolicitarAtendimento';
import { useAuth } from '../../context/useAuth';
import { relatarAtendimento } from '../../services/relatoAtendimentoService';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/relatoAtendimentoService', () => ({
  relatarAtendimento: vi.fn(),
}));

describe('SolicitarAtendimento (Admin / Triagem Manual)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 10, nome: 'Admin TDB', email: 'admin@example.com', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });
  });

  it('exibe o formulario de solicitacao sem campos tecnicos', async () => {
    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );

    // Validar que os campos ocultados não estão visíveis
    expect(screen.queryByLabelText(/Prioridade/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Canal/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Gravidade bucal/i)).not.toBeInTheDocument();

    // Validar que o campo geral de Nome está visível por padrão (como Criança ou Adolescente está selecionado inicialmente)
    expect(screen.getByLabelText(/Nome da pessoa atendida/i)).toBeInTheDocument();
  });

  it('deve ocultar campo de nome geral e exibir apenas codinome quando o tipo for Mulher Apolonia', async () => {
    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );


    fireEvent.click(screen.getByRole('radio', { name: /Mulher em Vulnerabilidade/i }));
    fireEvent.change(screen.getByLabelText(/Como deseja se apresentar/i), { target: { value: 'CODINOME' } });

    // O campo geral de nome deve desaparecer
    expect(screen.queryByLabelText(/Nome da pessoa atendida/i)).not.toBeInTheDocument();

    // O campo codinome deve aparecer no bloco de sigilo sensível
    expect(screen.getByLabelText(/^Codinome$/i)).toBeInTheDocument();
  });

  it('deve submeter o payload correto com o codinome mapeado para nomeCodificado para Mulher Apolonia', async () => {
    vi.mocked(relatarAtendimento).mockResolvedValue({
      atendimentoId: 123,
      pessoaAtendidaId: 456,
      status: 'ABERTO',
      mensagem: 'Relato recebido',
    });

    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );


    fireEvent.click(screen.getByRole('radio', { name: /Mulher em Vulnerabilidade/i }));
    fireEvent.change(screen.getByLabelText(/Como deseja se apresentar/i), { target: { value: 'CODINOME' } });

    fireEvent.change(screen.getByLabelText(/Como podemos entrar em contato/i), { target: { value: 'INFORMADO' } });
    // Preenche telefone, email, codinome e descricao
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '(11) 98888-8888' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Codinome$/i), { target: { value: 'Aurora Segura' } });
    fireEvent.change(screen.getByLabelText(/Descricao da situacao/i), { target: { value: 'Esta e uma descricao de teste valida com mais de 15 caracteres.' } });

    // Clica no botão de enviar
    const submitBtn = screen.getByRole('button', { name: /Enviar relato/i });
    fireEvent.click(submitBtn);

    const confirmBtn = await screen.findByRole('button', { name: /^Enviar$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(relatarAtendimento).toHaveBeenCalled();
    });

    // O payload enviado deve conter nomeCodificado = 'Aurora Segura' (mapeado de codinome),
    const payload = vi.mocked(relatarAtendimento).mock.calls[0][0];
    expect(payload.nomeCodificado).toBe('Aurora Segura');
    expect(JSON.stringify(payload)).not.toContain('Maria Silva');
    expect(payload).not.toHaveProperty('canalComunicacaoId');
    expect(payload.prioridade).toBe(3); // Default inicial
  });

  it('deve exibir os rotulos corretos para o nivel de risco quando o tipo for Mulher Apolonia', async () => {
    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );


    fireEvent.click(screen.getByRole('radio', { name: /Mulher em Vulnerabilidade/i }));
    fireEvent.change(screen.getByLabelText(/Como deseja se apresentar/i), { target: { value: 'CODINOME' } });

    // Encontra o select de nível de risco
    const selectRisco = screen.getByLabelText(/Nivel de risco/i) as HTMLSelectElement;
    expect(selectRisco).toBeInTheDocument();

    const options = Array.from(selectRisco.options).map(opt => opt.textContent);
    expect(options).toEqual([
      '1 - Baixo',
      '2 - Moderado',
      '3 - Medio',
      '4 - Alto',
      '5 - Critico'
    ]);
  });

  it('deve aplicar máscara de telefone enquanto a pessoa digita', async () => {
    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );

    const telefone = screen.getByLabelText(/Telefone/i) as HTMLInputElement;

    fireEvent.change(telefone, { target: { value: '11988887777' } });

    expect(telefone.value).toBe('(11) 98888-7777');
  });

  it('envia sem contato externo e sem responder ao boletim após confirmação', async () => {
    render(<BrowserRouter><SolicitarAtendimento /></BrowserRouter>);
    fireEvent.click(screen.getByRole('radio', { name: /Mulher em Vulnerabilidade/i }));
    expect(screen.queryByLabelText(/Telefone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Email$/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Como deseja se apresentar/i), { target: { value: 'GERADO' } });
    fireEvent.change(screen.getByLabelText(/Descricao da situacao/i), { target: { value: 'Preciso conversar com a equipe de acolhimento.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar relato/i }));
    expect(relatarAtendimento).not.toHaveBeenCalled();
    const confirm = await screen.findByRole('button', { name: /^Enviar$/i });
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Somente pela aplicação');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Prefiro não responder');
    fireEvent.click(confirm);
    await waitFor(() => expect(relatarAtendimento).toHaveBeenCalledOnce());
    const payload = vi.mocked(relatarAtendimento).mock.calls[0][0];
    expect(payload.email).toBe('');
    expect(payload.telefone).toBe('');
    expect(payload.temBoletimOcorrencia).toBeUndefined();
    expect(payload.nomeCodificado).toMatch(/^Pessoa /);
    expect(payload.idContaBeneficiario).toBe(10);
    expect(JSON.stringify(payload)).not.toContain('maria@example.com');
  });

  it('usa o nome real somente quando escolhido explicitamente', async () => {
    render(<BrowserRouter><SolicitarAtendimento /></BrowserRouter>);
    fireEvent.click(screen.getByRole('radio', { name: /Mulher em Vulnerabilidade/i }));
    fireEvent.change(screen.getByLabelText(/Como deseja se apresentar/i), { target: { value: 'NOME' } });
    fireEvent.change(screen.getByLabelText('Nome que deseja compartilhar'), { target: { value: 'Nome autorizado' } });
    fireEvent.change(screen.getByLabelText(/Descricao da situacao/i), { target: { value: 'Preciso conversar com a equipe de acolhimento.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar relato/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^Enviar$/i }));
    await waitFor(() => expect(relatarAtendimento).toHaveBeenCalledOnce());
    expect(vi.mocked(relatarAtendimento).mock.calls[0][0].nomeCodificado).toBe('Nome autorizado');
  });
});

 describe('Apolônia autenticada', () => {
 function preparar() {
   vi.mocked(useAuth).mockReturnValue({user:{id:7,nome:'Aurora sintética',email:null,tipoUsuario:'BENEFICIARIO',tipoBeneficiario:'MULHER_APOLONIA',ativo:true}} as ReturnType<typeof useAuth>);
   render(<BrowserRouter><SolicitarAtendimento /></BrowserRouter>);
 }
 it('pede somente descrição e envia após confirmação', async () => {
   vi.mocked(relatarAtendimento).mockReset(); preparar();
   expect(screen.queryByRole('radio')).not.toBeInTheDocument();
   expect(screen.queryByLabelText(/Codinome|Nivel de risco|boletim|Telefone|Email/i)).not.toBeInTheDocument();
   fireEvent.change(screen.getByLabelText('Descricao da situacao'),{target:{value:'Preciso de apoio odontológico.'}});
   fireEvent.click(screen.getByRole('button',{name:'Enviar relato'}));
   expect(relatarAtendimento).not.toHaveBeenCalled();
   expect(screen.getAllByText('Preciso de apoio odontológico.').length).toBeGreaterThan(0);
   fireEvent.click(screen.getByRole('button',{name:/^Enviar$/}));
   await waitFor(()=>expect(relatarAtendimento).toHaveBeenCalledWith({descricao:'Preciso de apoio odontológico.'}));
 });
 it('valida descrição antes de abrir confirmação', () => {
   vi.mocked(relatarAtendimento).mockReset();preparar();fireEvent.click(screen.getByRole('button',{name:'Enviar relato'}));
   expect(screen.getByText('Descreva a situação com 15 a 4000 caracteres.')).toBeInTheDocument();expect(relatarAtendimento).not.toHaveBeenCalled();
 });
});

describe('Criança/Adolescente autenticado', () => {
  function preparar() {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 9,
        nome: 'Pedro Santos',
        email: 'pedro@exemplo.com',
        tipoUsuario: 'BENEFICIARIO',
        tipoBeneficiario: 'CRIANCA_ADOLESCENTE',
        idade: 12,
        nomeResponsavel: 'Carla Santos',
        escola: 'E.E. Dom Pedro',
        telefone: '11999998888',
        ativo: true,
      },
    } as ReturnType<typeof useAuth>);
    render(<BrowserRouter><SolicitarAtendimento /></BrowserRouter>);
  }

  it('exibe resumo do perfil salvo e pede somente a descrição da situação', async () => {
    vi.mocked(relatarAtendimento).mockReset();
    preparar();

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome do responsavel|Escola|Idade|Telefone/i)).not.toBeInTheDocument();
    expect(screen.getByText('Criança ou adolescente')).toBeInTheDocument();
    expect(screen.getByText(/Perfil vinculado: Pedro Santos \(12 anos\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Responsável: Carla Santos • Escola: E\.E\. Dom Pedro/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Descricao da situacao'), {
      target: { value: 'Dor de dente constante há uma semana na escola.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar relato' }));

    expect(relatarAtendimento).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Enviar$/ }));

    await waitFor(() =>
      expect(relatarAtendimento).toHaveBeenCalledWith({
        descricao: 'Dor de dente constante há uma semana na escola.',
      })
    );
  });
});
