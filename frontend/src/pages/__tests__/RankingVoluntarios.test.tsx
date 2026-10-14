import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RankingVoluntarios from '../RankingVoluntarios';
import { getRanking } from '../../services/voluntariosService';

vi.mock('../../services/voluntariosService', () => ({
  getRanking: vi.fn(),
}));

const ranking = [
  {
    nome: 'Dra. Ana',
    codigoIndicacao: 'ANA-01',
    pontosIndicacao: 30,
    especialidade: { id: 1, nome: 'Odontopediatria' },
  },
  {
    nome: 'Dr. Bruno',
    codigoIndicacao: 'BRU-02',
    pontosIndicacao: 20,
  },
  {
    nome: 'Dra. Carla',
    codigoIndicacao: 'CAR-03',
    pontosIndicacao: 10,
  },
  {
    nome: 'Dr. Diego',
    codigoIndicacao: 'DIE-04',
    pontosIndicacao: 1,
  },
];

describe('RankingVoluntarios', () => {
  beforeEach(() => {
    vi.mocked(getRanking).mockResolvedValue(ranking);
  });

  it('mantém o consumo do Top 10 e apresenta o ranking retornado pela API', async () => {
    render(
      <MemoryRouter>
        <RankingVoluntarios />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getRanking).toHaveBeenCalledWith(10));

    const podium = await screen.findByRole('list', { name: 'Pódio dos voluntários' });
    const podiumItems = within(podium).getAllByRole('listitem');

    expect(podiumItems).toHaveLength(3);
    expect(podiumItems[0]).toHaveTextContent('Dra. Ana');
    expect(podiumItems[1]).toHaveTextContent('Dr. Bruno');
    expect(podiumItems[2]).toHaveTextContent('Dra. Carla');
    expect(screen.getByText('Dr. Diego')).toBeInTheDocument();
    expect(screen.getByText('1 ponto')).toBeInTheDocument();
  });

  it('mantém o primeiro lugar central e destacado sem alterar a ordem no mobile', async () => {
    render(
      <MemoryRouter>
        <RankingVoluntarios />
      </MemoryRouter>,
    );

    const firstPlace = await screen.findByRole('listitem', {
      name: '1º lugar: Dra. Ana, 30 pontos',
    });
    const secondPlace = screen.getByRole('listitem', {
      name: '2º lugar: Dr. Bruno, 20 pontos',
    });

    expect(firstPlace).toHaveClass('col-span-2', 'md:col-span-1', 'md:col-start-2');
    expect(secondPlace).not.toHaveClass('col-span-2');
    expect(firstPlace.parentElement).toHaveClass('min-w-0', 'grid-cols-2', 'md:grid-cols-3');
  });
});
