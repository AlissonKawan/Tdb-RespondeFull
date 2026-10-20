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
});
