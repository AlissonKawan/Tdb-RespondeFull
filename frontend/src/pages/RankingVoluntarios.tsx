import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRanking, type RankingResponse } from '../services/voluntariosService';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/FeedbackState';

const RankingVoluntarios: React.FC = () => {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  async function carregarRanking() {
    try {
      setLoading(true);
      setError(null);
      // Puxando o top 10
      const response = await getRanking(10);
      setRanking(response);
    } catch (err) {
      console.error('Erro ao carregar ranking:', err);
      setError('Não foi possível carregar o ranking de indicações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarRanking();
  }, []);;

  const renderPodium = () => {
    if (ranking.length === 0) return null;

    const top3 = ranking.slice(0, 3);
    const gold = top3[0];
    const silver = top3[1];
    const bronze = top3[2];

    return (
      <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12 mt-10">
        {/* Segundo Lugar (Prata) */}
        {silver && (
          <div className="flex flex-col items-center order-2 md:order-1 w-full md:w-1/3 max-w-[250px]">
            <div className="bg-slate-200 border-2 border-slate-300 shadow-md shadow-slate-300/50 rounded-t-2xl w-full h-32 flex flex-col justify-center items-center relative">
              <div className="absolute -top-6 bg-slate-300 text-slate-700 font-bold w-12 h-12 rounded-full flex items-center justify-center text-xl border-4 border-white shadow-sm">
                2
              </div>
              <p className="font-bold text-slate-800 text-lg truncate w-full px-4 text-center mt-4">
                {silver.nome}
              </p>
              <p className="text-sm font-semibold text-slate-600 mt-1">{silver.pontosIndicacao} pts</p>
            </div>
          </div>
        )}

        {/* Primeiro Lugar (Ouro) */}
        {gold && (
          <div className="flex flex-col items-center order-1 md:order-2 w-full md:w-1/3 max-w-[280px]">
            <div className="bg-gradient-to-t from-yellow-300 to-yellow-100 border-2 border-yellow-400 shadow-xl shadow-yellow-500/30 rounded-t-2xl w-full h-44 flex flex-col justify-center items-center relative z-10 transform scale-105">
              <div className="absolute -top-8 bg-yellow-400 text-yellow-900 font-black w-16 h-16 rounded-full flex items-center justify-center text-3xl border-4 border-white shadow-md">
                1
              </div>
              <p className="font-black text-yellow-900 text-xl truncate w-full px-4 text-center mt-6">
                {gold.nome}
              </p>
              <p className="text-base font-bold text-yellow-700 mt-1">{gold.pontosIndicacao} pts</p>
              <div className="mt-2 text-xs text-yellow-600 bg-yellow-200/50 px-2 py-1 rounded-full font-semibold">
                👑 Top Indicador
              </div>
            </div>
          </div>
        )}

        {/* Terceiro Lugar (Bronze) */}
        {bronze && (
          <div className="flex flex-col items-center order-3 w-full md:w-1/3 max-w-[250px]">
            <div className="bg-orange-100 border-2 border-orange-200 shadow-md shadow-orange-300/40 rounded-t-2xl w-full h-24 flex flex-col justify-center items-center relative">
              <div className="absolute -top-6 bg-orange-300 text-orange-900 font-bold w-12 h-12 rounded-full flex items-center justify-center text-xl border-4 border-white shadow-sm">
                3
              </div>
              <p className="font-bold text-orange-900 text-base truncate w-full px-4 text-center mt-4">
                {bronze.nome}
              </p>
              <p className="text-sm font-semibold text-orange-800 mt-1">{bronze.pontosIndicacao} pts</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRestOfList = () => {
    if (ranking.length <= 3) return null;

    const rest = ranking.slice(3);

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-[#0F172A] mb-4 border-b pb-2">Outros Indicadores (Top 10)</h3>
        <div className="space-y-3">
          {rest.map((voluntario, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className="font-bold text-slate-400 w-6 text-center">
                  #{index + 4}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{voluntario.nome}</p>
                  {voluntario.especialidade && (
                    <p className="text-xs text-slate-500">{voluntario.especialidade.nome}</p>
                  )}
                </div>
              </div>
              <div className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                {voluntario.pontosIndicacao} pts
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHeader
        title="Ranking de Voluntários"
        description="Acompanhe os voluntários que mais indicaram pessoas para nossa rede do bem."
        eyebrow="TDB Responde"
        align="center"
      />

      <Container className="mt-8">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Voltar
          </Button>
        </div>

        {/* Feedback States */}
        {loading && (
          <div className="max-w-md mx-auto mt-10">
            <LoadingState title="Buscando as pontuações no servidor..." />
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mt-10">
            <ErrorState title="Falha ao carregar ranking" description={error} />
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <div className="max-w-md mx-auto mt-10">
            <EmptyState
              title="Ranking Vazio"
              description="Nenhum voluntário pontuou ainda. Seja o primeiro a convidar alguém!"
            />
          </div>
        )}

        {/* Content */}
        {!loading && !error && ranking.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            {renderPodium()}
            {renderRestOfList()}
          </div>
        )}
      </Container>
    </div>
  );
};

export default RankingVoluntarios;
