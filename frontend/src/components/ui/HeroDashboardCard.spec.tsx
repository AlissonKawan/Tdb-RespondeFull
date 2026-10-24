import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HeroDashboardCard from './HeroDashboardCard';

describe('HeroDashboardCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('mantém o programa por sete segundos antes de avançar automaticamente', () => {
    render(<HeroDashboardCard />);

    expect(screen.getByRole('heading', { name: 'Dentista do Bem' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(6999));
    expect(screen.getByRole('heading', { name: 'Dentista do Bem' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));

    const activeHeading = screen.getByRole('heading', { name: 'Apolônias do Bem' });
    const activeSlide = activeHeading.closest('article');

    expect(activeSlide).toHaveClass('hero-program-slide--active');
    expect(activeSlide?.querySelector('.hero-program-image')).toBeInTheDocument();
    expect(activeSlide?.querySelector('.hero-program-copy')).toBeInTheDocument();
  });

  it('continua avançando quando o ponteiro está sobre o carrossel', () => {
    render(<HeroDashboardCard />);

    fireEvent.mouseEnter(screen.getByLabelText('Programas de acolhimento social da Turma do Bem'));
    act(() => vi.advanceTimersByTime(7000));

    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();
  });

  it('continua avançando quando um controle do carrossel mantém o foco', () => {
    render(<HeroDashboardCard />);

    screen.getByRole('button', { name: 'Mostrar próximo programa' }).focus();
    act(() => vi.advanceTimersByTime(7000));

    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();
  });

  it('reinicia o cronômetro de 7 segundos ao clicar em próximo, anterior ou nos indicadores', () => {
    render(<HeroDashboardCard />);

    // Avança 6 segundos (faltando apenas 1s para o timer original disparar)
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('heading', { name: 'Dentista do Bem' })).toBeInTheDocument();

    // Clica para avançar manualmente
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar próximo programa' }));
    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();

    // Após 2 segundos (que já teria estourado o timer antigo de 7s), deve continuar no mesmo slide
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();

    // Só deve trocar quando completar os 7 segundos desde o clique (mais 5s)
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('heading', { name: 'Dentista do Bem' })).toBeInTheDocument();

    // Testa também clique no indicador direto após 6 segundos
    act(() => vi.advanceTimersByTime(6000));
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar Apolônias do Bem' }));
    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(6999));
    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('heading', { name: 'Dentista do Bem' })).toBeInTheDocument();
  });
});
