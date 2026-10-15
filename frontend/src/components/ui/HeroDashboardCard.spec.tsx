import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HeroDashboardCard from './HeroDashboardCard';

describe('HeroDashboardCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('avança automaticamente para o próximo programa depois de três segundos', () => {
    render(<HeroDashboardCard />);

    expect(screen.getByRole('heading', { name: 'Dentista do Bem' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();
  });

  it('continua avançando quando o ponteiro está sobre o carrossel', () => {
    render(<HeroDashboardCard />);

    fireEvent.mouseEnter(screen.getByLabelText('Programas de acolhimento social da Turma do Bem'));
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole('heading', { name: 'Apolônias do Bem' })).toBeInTheDocument();
  });
});
