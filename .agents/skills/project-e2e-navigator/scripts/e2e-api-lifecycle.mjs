#!/usr/bin/env node
/**
 * Script de Auditoria E2E da API TDB Responde Full
 *
 * Modos de uso:
 *   node .agents/skills/project-e2e-navigator/scripts/e2e-api-lifecycle.mjs --dry-run
 *   node .agents/skills/project-e2e-navigator/scripts/e2e-api-lifecycle.mjs --execute
 */

const BASE_URL = (process.env.API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const args = new Set(process.argv.slice(2));
const isExecute = args.has('--execute');

const E2E_BENEFICIARIO_EMAIL = process.env.E2E_BENEFICIARIO_EMAIL || 'e2e.beneficiario.nav@tdb.test';
const E2E_VOLUNTARIO_EMAIL = process.env.E2E_VOLUNTARIO_EMAIL || `e2e.voluntario.${Date.now()}@tdb.test`;
const E2E_PASSWORD = process.env.E2E_PASSWORD || 'Teste@123456';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tdb.org.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function request(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { ok: res.ok, status: res.status, data };
}

function logStep(step, status, detail = '') {
  const icon = status === 'OK' ? '[OK]' : status === 'SKIP' ? '[SKIP]' : '[ERRO]';
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
}

async function runDryRun() {
  console.log(`\n=== Auditoria E2E TDB Responde (MODO DRY-RUN / SOMENTE LEITURA) ===`);
  console.log(`Alvo: ${BASE_URL}\n`);

  for (const endpoint of ['/ping', '/health', '/especialidades']) {
    try {
      const res = await request('GET', endpoint);
      if (res.ok) {
        logStep(`GET ${endpoint}`, 'OK', `HTTP ${res.status}`);
      } else {
        logStep(`GET ${endpoint}`, 'ERRO', `HTTP ${res.status}`);
      }
    } catch (err) {
      logStep(`GET ${endpoint}`, 'ERRO', `Servidor inacessível (${err.message})`);
      process.exitCode = 1;
      return;
    }
  }

  console.log(`\nDry-run concluído. Para rodar o ciclo completo (criar -> testar -> apagar), use --execute com autorização do usuário.`);
}

async function runFullLifecycle() {
  console.log(`\n=== Auditoria E2E TDB Responde (CICLO COMPLETO COM TEARDOWN) ===`);
  console.log(`Alvo: ${BASE_URL}\n`);

  const cleanupState = {
    adminToken: null,
    beneficiarioToken: null,
    voluntarioToken: null,
    beneficiarioContaId: null,
    voluntarioContaId: null,
    voluntarioId: null,
    atendimentoId: null,
    agendaId: null,
  };

  try {
    // 1. Verificar Especialidades
    const espRes = await request('GET', '/especialidades');
    const especialidadeId = Array.isArray(espRes.data) && espRes.data.length > 0 ? espRes.data[0].id : 1;
    logStep('1. Listar especialidades (GET /especialidades)', espRes.ok ? 'OK' : 'ERRO', `HTTP ${espRes.status}`);

    // 2. Criar ou autenticar Beneficiário
    let benReg = await request('POST', '/auth/register', {
      body: {
        nome: 'Beneficiario E2E Navegacao',
        email: E2E_BENEFICIARIO_EMAIL,
        senha: E2E_PASSWORD,
        tipoUsuario: 'BENEFICIARIO',
      },
    });
    if (benReg.status === 201 || benReg.status === 409) {
      logStep('2. Criar/Reutilizar Beneficiário (POST /auth/register)', 'OK', `HTTP ${benReg.status}`);
    } else {
      throw new Error(`Falha ao registrar beneficiário: HTTP ${benReg.status}`);
    }

    const benLogin = await request('POST', '/auth/login', {
      body: { email: E2E_BENEFICIARIO_EMAIL, senha: E2E_PASSWORD },
    });
    if (!benLogin.ok) {
      throw new Error(`Falha no login do beneficiário: HTTP ${benLogin.status}`);
    }
    cleanupState.beneficiarioToken = benLogin.data?.token;
    cleanupState.beneficiarioContaId = benLogin.data?.user?.id;
    logStep('3. Login do Beneficiário (POST /auth/login)', 'OK', `Conta ID ${cleanupState.beneficiarioContaId}`);

    // 3. Criar Voluntário temporário
    const volReg = await request('POST', '/auth/register', {
      body: {
        nome: 'Voluntario E2E Temporario',
        email: E2E_VOLUNTARIO_EMAIL,
        senha: E2E_PASSWORD,
        tipoUsuario: 'VOLUNTARIO',
        especialidadeId,
        motivoVoluntariado: 'Auditoria automatizada E2E do projeto TDB Responde Full.',
        cro: '12345',
        ufCro: 'SP',
      },
    });
    if (!volReg.ok) {
      throw new Error(`Falha ao cadastrar voluntário: HTTP ${volReg.status}`);
    }
    cleanupState.voluntarioContaId = volReg.data?.id;
    cleanupState.voluntarioId = volReg.data?.voluntarioId;
    logStep('4. Criar Voluntário (POST /auth/register)', 'OK', `Voluntario ID ${cleanupState.voluntarioId}`);

    // 4. Login Admin para aprovar voluntário (se credenciais de admin estiverem disponíveis)
    const adminLogin = await request('POST', '/auth/login', {
      body: { email: ADMIN_EMAIL, senha: ADMIN_PASSWORD },
    });
    if (adminLogin.ok) {
      cleanupState.adminToken = adminLogin.data?.token;
      const adminId = adminLogin.data?.user?.id;
      logStep('5. Login Admin (POST /auth/login)', 'OK', `Admin ID ${adminId}`);

      if (cleanupState.voluntarioId) {
        const aprovarRes = await request('PUT', `/voluntarios/${cleanupState.voluntarioId}/aprovar`, {
          token: cleanupState.adminToken,
          body: { aprovadorId: adminId },
        });
        logStep('6. Aprovar Voluntário (PUT /voluntarios/{id}/aprovar)', aprovarRes.ok ? 'OK' : 'ERRO', `HTTP ${aprovarRes.status}`);
      }
    } else {
      logStep('5. Login Admin (POST /auth/login)', 'SKIP', 'Credenciais ADMIN_EMAIL/ADMIN_PASSWORD não configuradas ou inválidas');
    }

    // 5. Beneficiário cria Atendimento (POST /atendimentos/relatar)
    const relatoRes = await request('POST', '/atendimentos/relatar', {
      token: cleanupState.beneficiarioToken,
      body: {
        idContaBeneficiario: cleanupState.beneficiarioContaId,
        tipo: 'CRIANCA_ADOLESCENTE',
        nomeCodificado: 'Paciente Teste E2E',
        telefone: '(11) 99999-0000',
        email: E2E_BENEFICIARIO_EMAIL,
        idade: 12,
        nomeResponsavel: 'Responsavel Teste E2E',
        escola: 'Escola E2E',
        gravidadeBucal: 4,
        prioridade: 2,
        descricao: 'Relato criado pela skill de navegacao E2E e sera excluido em seguida.',
      },
    });
    if (!relatoRes.ok) {
      throw new Error(`Falha ao criar atendimento: HTTP ${relatoRes.status}`);
    }
    cleanupState.atendimentoId = relatoRes.data?.atendimentoId;
    logStep('7. Criar Atendimento (POST /atendimentos/relatar)', 'OK', `Atendimento ID ${cleanupState.atendimentoId}`);

    // 6. Enviar Mensagem no Chat do Atendimento
    const msgRes = await request('POST', `/atendimentos/${cleanupState.atendimentoId}/mensagens`, {
      token: cleanupState.beneficiarioToken,
      body: {
        conteudo: 'Mensagem de teste E2E enviada pelo beneficiario.',
        enviadoPor: 'BENEFICIARIO',
      },
    });
    logStep('8. Enviar Mensagem (POST /atendimentos/{id}/mensagens)', msgRes.ok ? 'OK' : 'ERRO', `HTTP ${msgRes.status}`);

    // 7. Listar Mensagens do Atendimento
    const listMsgRes = await request('GET', `/atendimentos/${cleanupState.atendimentoId}/mensagens?limite=50`, {
      token: cleanupState.beneficiarioToken,
    });
    logStep('9. Validar Mensagens (GET /atendimentos/{id}/mensagens)', listMsgRes.ok ? 'OK' : 'ERRO', `Total: ${Array.isArray(listMsgRes.data) ? listMsgRes.data.length : 0}`);
  } finally {
    console.log(`\n--- Executando Limpeza / Teardown dos Dados Criados ---`);
    const tokenLimpeza = cleanupState.adminToken || cleanupState.beneficiarioToken;

    if (cleanupState.agendaId && tokenLimpeza) {
      const delAgenda = await request('DELETE', `/agendas/${cleanupState.agendaId}`, { token: tokenLimpeza });
      logStep(`Teardown: DELETE /agendas/${cleanupState.agendaId}`, delAgenda.ok ? 'OK' : 'ERRO', `HTTP ${delAgenda.status}`);
    }

    if (cleanupState.atendimentoId && tokenLimpeza) {
      const delAtend = await request('DELETE', `/atendimentos/${cleanupState.atendimentoId}`, { token: tokenLimpeza });
      logStep(`Teardown: DELETE /atendimentos/${cleanupState.atendimentoId}`, delAtend.ok ? 'OK' : 'ERRO', `HTTP ${delAtend.status}`);
    }

    if (cleanupState.voluntarioId) {
      const delVol = await request('DELETE', `/voluntarios/${cleanupState.voluntarioId}`, { token: tokenLimpeza });
      logStep(`Teardown: DELETE /voluntarios/${cleanupState.voluntarioId}`, delVol.ok ? 'OK' : 'ERRO', `HTTP ${delVol.status}`);
    }

    if (cleanupState.voluntarioContaId) {
      const delContaVol = await request('DELETE', `/usuarios/${cleanupState.voluntarioContaId}`, { token: tokenLimpeza });
      logStep(`Teardown: DELETE /usuarios/${cleanupState.voluntarioContaId}`, delContaVol.ok ? 'OK' : 'ERRO', `HTTP ${delContaVol.status}`);
    }
  }
}

if (isExecute) {
  runFullLifecycle().catch((err) => {
    console.error('\n[FALHA E2E]:', err.message);
    process.exitCode = 1;
  });
} else {
  runDryRun();
}
