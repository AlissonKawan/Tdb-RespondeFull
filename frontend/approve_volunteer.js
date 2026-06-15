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
  console.log("Iniciando aprovação do voluntário...");
  try {
    // 1. Criar ou Logar Admin
    let admin;
    try {
      admin = await request('/auth/register', 'POST', {
        nome: "Admin Teste",
        email: "admin.apresentacao@tdb.com",
        senha: "senha123",
        tipoUsuario: "ADMIN"
      });
      console.log("Admin criado com sucesso!", admin.id);
    } catch(e) {
      console.log("Admin já existe, tentando logar...");
      admin = await request('/auth/login', 'POST', { email: "admin.apresentacao@tdb.com", senha: "senha123" });
      console.log("Login Admin realizado com sucesso! ID:", admin.id);
    }

    // O voluntarioId retornado anteriormente foi 86
    const voluntarioId = 86;
    
    // 2. Aprovar Voluntário
    console.log("Aprovando voluntário ID:", voluntarioId);
    await request(`/voluntarios/${voluntarioId}/aprovar`, 'PUT', { aprovadorId: admin.id });
    console.log("Voluntário aprovado com sucesso!");

    // 3. Logar com o Voluntário para ver se está ativo
    const voluntarioLogado = await request('/auth/login', 'POST', { email: "carlos.voluntario@tdb.com", senha: "senha123" });
    console.log("Login do voluntário AGORA FUNCIONOU! Ativo:", voluntarioLogado.ativo);

  } catch (error) {
    console.error("Erro durante o processo:", error.message);
  }
}

run();
