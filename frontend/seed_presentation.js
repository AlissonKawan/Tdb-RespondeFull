const API_URL = 'https://tdbresponde.azurewebsites.net';

async function request(path, method, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_URL}${path}`, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  
  if (!res.ok) {
    console.error(`Error on ${method} ${path}:`, json);
    throw new Error(`API Error: ${res.status}`);
  }
  return json;
}

async function run() {
  console.log("Iniciando a criação de dados para a apresentação...");
  try {
    // 1. Criar Beneficiário
    console.log("1. Criando Beneficiário...");
    let beneficiario;
    try {
      beneficiario = await request('/auth/register', 'POST', {
        nome: "Ana Silva",
        email: "ana.beneficiaria@tdb.com",
        senha: "senha123",
        tipoUsuario: "BENEFICIARIO",
        tipoBeneficiario: "MULHER_APOLONIA"
      });
      console.log("Beneficiário criado com sucesso!", beneficiario);
    } catch(e) {
      console.log("Beneficiário já existe, tentando login...");
      beneficiario = await request('/auth/login', 'POST', { email: "ana.beneficiaria@tdb.com", senha: "senha123" });
      console.log("Login de beneficiário realizado com sucesso!");
    }

    // 2. Criar Voluntário
    console.log("2. Criando Voluntário...");
    let voluntario;
    try {
      voluntario = await request('/auth/register', 'POST', {
        nome: "Dr. Carlos (Voluntário)",
        email: "carlos.voluntario@tdb.com",
        senha: "senha123",
        tipoUsuario: "VOLUNTARIO",
        motivoVoluntariado: "Quero ajudar a ONG e a comunidade",
        especialidadeId: 1,
        cro: "12345",
        ufCro: "SP"
      });
      console.log("Voluntário criado com sucesso!", voluntario);
    } catch(e) {
      console.log("Voluntário já existe, tentando login...");
      voluntario = await request('/auth/login', 'POST', { email: "carlos.voluntario@tdb.com", senha: "senha123" });
      console.log("Login de voluntário realizado com sucesso!");
    }

    // 3. Criar Atendimento (Relatar)
    console.log("3. Solicitando Atendimento...");
    const atendimento = await request('/atendimentos/relatar', 'POST', {
      idContaBeneficiario: beneficiario.id,
      nomeCodificado: "Ana S.",
      telefone: "11999999999",
      email: "ana.beneficiaria@tdb.com",
      tipo: "MULHER_APOLONIA",
      canalComunicacaoId: 1,
      prioridade: 3,
      descricao: "Preciso de ajuda urgente com dores intensas.",
      nivelRisco: 2,
      temBoletimOcorrencia: true,
      necessitaSigiloAbsoluto: true
    });
    console.log("Atendimento criado com sucesso! ID:", atendimento.atendimentoId);

    // 4. Assumir Atendimento
    console.log("4. Voluntário assumindo atendimento...");
    const assumido = await request(`/atendimentos/${atendimento.atendimentoId}/assumir`, 'PUT', {
      voluntarioId: voluntario.id
    });
    console.log("Atendimento assumido pelo voluntário!");

    // 5. Trocar Mensagens
    console.log("5. Trocando mensagens iniciais...");
    await request(`/atendimentos/${atendimento.atendimentoId}/mensagens`, 'POST', {
      conteudo: "Olá Ana, sou o Dr. Carlos. Acabei de pegar o seu caso. Como você está hoje?",
      enviadoPor: "VOLUNTARIO"
    });
    
    await request(`/atendimentos/${atendimento.atendimentoId}/mensagens`, 'POST', {
      conteudo: "Olá Dr. Carlos, estou com muita dor, agradeço o contato rápido.",
      enviadoPor: "BENEFICIARIO"
    });
    console.log("Mensagens trocadas com sucesso!");

    console.log("\n==== RESUMO PARA A APRESENTAÇÃO ====");
    console.log("E-mail do Voluntário: carlos.voluntario@tdb.com | Senha: senha");
    console.log("E-mail do Beneficiário: ana.beneficiaria@tdb.com | Senha: senha");
    console.log("=====================================");

  } catch (error) {
    console.error("Erro durante o processo:", error.message);
  }
}

run();
