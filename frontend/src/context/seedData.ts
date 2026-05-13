// src/context/seedData.ts
import type { TDBState } from '../types/index';

export const SEED_STATE: TDBState = {
  nextId: 100,
  voluntarios: [
    { id: 1, nome: 'Ana Souza',     usuario: 'ana.souza',     senha: '123456', especialidade: 'Odontologia',        disponivel: true,  acessoSigilo: true  },
    { id: 2, nome: 'Carlos Lima',   usuario: 'carlos.lima',   senha: '123456', especialidade: 'Assistência Social', disponivel: true,  acessoSigilo: false },
    { id: 3, nome: 'Beatriz Nunes', usuario: 'beatriz.nunes', senha: '123456', especialidade: 'Psicologia',         disponivel: false, acessoSigilo: true  },
  ],
  atendimentos: [
    {
      id: 1,
      tipo: 'crianca',
      pessoa: {
        nomeCodificado: 'CA-2024-001',
        email: 'resp@email.com',
        telefone: '(11) 9 9000-0001',
        responsavel: 'Roberto Souza',
        escola: 'EMEF Liberdade',
        idade: 12,
        gravidadeBucal: 2,
      },
      canal: 'WhatsApp',
      prioridade: 2,
      status: 'Em andamento',
      voluntarioId: 1,
      dataAbertura: '2025-03-10',
      mensagens: [
        { de: 'pessoa',     texto: 'Olá, preciso de ajuda com o tratamento dentário do meu filho.', hora: '09:12' },
        { de: 'voluntario', texto: 'Olá! Pode contar. Qual é a situação atual da criança?',          hora: '09:15' },
        { de: 'pessoa',     texto: 'Ele está com dor há 3 dias. A escola indicou consulta urgente.', hora: '09:20' },
      ],
      historico: [
        { statusAnterior: 'Aberto', statusNovo: 'Em andamento', alteradoPor: 'Ana Souza', dataHora: '2025-03-10 09:14' },
      ],
    },
    {
      id: 2,
      tipo: 'mulher',
      pessoa: {
        codinome: 'VIOLETA-07',
        email: 'prot@email.com',
        telefone: '(11) 9 8000-0002',
        nivelRisco: 3,
        temBoletim: true,
        sigiloAbsoluto: true,
      },
      canal: 'E-mail',
      prioridade: 3,
      status: 'Aberto',
      voluntarioId: null,
      dataAbertura: '2025-03-12',
      mensagens: [
        { de: 'pessoa', texto: 'Preciso de orientação jurídica urgente sobre proteção.', hora: '14:00' },
      ],
      historico: [],
    },
    {
      id: 3,
      tipo: 'crianca',
      pessoa: {
        nomeCodificado: 'CA-2024-002',
        email: '',
        telefone: '(11) 9 7000-0003',
        responsavel: 'Maria Pereira',
        escola: 'EMEF Jardins',
        idade: 9,
        gravidadeBucal: 1,
      },
      canal: 'Instagram',
      prioridade: 1,
      status: 'Encerrado',
      voluntarioId: 2,
      dataAbertura: '2025-03-01',
      mensagens: [
        { de: 'pessoa',     texto: 'Gostaria de saber sobre o programa de saúde bucal.',                              hora: '10:00' },
        { de: 'voluntario', texto: 'O programa inclui consultas gratuitas nas escolas parceiras. Vou agendar.',       hora: '10:45' },
        { de: 'pessoa',     texto: 'Muito obrigada!',                                                                 hora: '11:00' },
      ],
      historico: [
        { statusAnterior: 'Aberto',       statusNovo: 'Em andamento', alteradoPor: 'Carlos Lima', dataHora: '2025-03-01 10:44' },
        { statusAnterior: 'Em andamento', statusNovo: 'Encerrado',    alteradoPor: 'Carlos Lima', dataHora: '2025-03-02 16:00' },
      ],
    },
    {
      id: 4,
      tipo: 'mulher',
      pessoa: {
        codinome: 'ROSA-14',
        email: '',
        telefone: '',
        nivelRisco: 2,
        temBoletim: false,
        sigiloAbsoluto: false,
      },
      canal: 'WhatsApp',
      prioridade: 2,
      status: 'Aguardando',
      voluntarioId: 3,
      dataAbertura: '2025-03-14',
      mensagens: [
        { de: 'pessoa',     texto: 'Quero saber sobre acolhimento psicológico.',               hora: '16:30' },
        { de: 'voluntario', texto: 'Claro! Podemos agendar uma sessão. Qual sua disponibilidade?', hora: '16:45' },
      ],
      historico: [
        { statusAnterior: 'Aberto', statusNovo: 'Aguardando', alteradoPor: 'Beatriz Nunes', dataHora: '2025-03-14 16:44' },
      ],
    },
  ],
};