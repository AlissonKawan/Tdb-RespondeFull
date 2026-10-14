import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('navigates to a relative href through the SPA router', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Button href="/login">Entrar</Button>
        <Routes>
          <Route path="/login" element={<p>Página de login</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: 'Entrar' }));

    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  it('supports keyboard navigation when using the to property', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Button to="/cadastro">Criar conta</Button>
        <Routes>
          <Route path="/cadastro" element={<p>Página de cadastro</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.tab();
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByText('Página de cadastro')).toBeInTheDocument();
  });

  it('keeps external destinations as safe anchors', () => {
    render(<Button href="https://example.com">Documentação</Button>);

    const link = screen.getByRole('link', { name: 'Documentação' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('preserves regular submit button behavior', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button type="submit" onClick={handleClick}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toHaveAttribute('type', 'submit');

    await user.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
