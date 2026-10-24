import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('exibe o link correto do repositório no GitHub', () => {
    render(<Footer />);

    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/AlissonKawan/Tdb-RespondeFull/tree/Alisson'
    );
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('exibe a logo com dimensões proporcionais e sem excesso de tamanho', () => {
    render(<Footer />);

    const logo = screen.getByRole('img', {
      name: 'TDB Responde — Plataforma de atendimento da Turma do Bem.',
    });

    expect(logo).toHaveAttribute('src', '/img/logo-completa.png');
    expect(logo).toHaveAttribute('width', '840');
    expect(logo).toHaveAttribute('height', '672');
    expect(logo.className).toContain('w-32');
    expect(logo.className).toContain('md:w-36');
    expect(logo.className).not.toContain('w-56');
    expect(logo.className).not.toContain('w-64');
  });

  it('renderiza os membros da equipe e demais links', () => {
    render(<Footer />);

    expect(screen.getByText('Alisson Kawan')).toBeInTheDocument();
    expect(screen.getByText('Marcos Vinicius')).toBeInTheDocument();
    expect(screen.getByText('Eduardo Boni')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'LinkedIn Alisson' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LinkedIn Marcos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LinkedIn Eduardo' })).toBeInTheDocument();
  });
});
