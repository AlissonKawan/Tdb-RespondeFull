/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Header from './Header';
import Footer from './Footer';

afterEach(cleanup);

function pngSize(href: string) {
  const png = readFileSync(resolve(process.cwd(), 'public', href.replace(/^\//, '')));
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe('Aplicação da identidade visual', () => {
  it('usa a logo completa no header e no footer, com proporções do arquivo', () => {
    render(<MemoryRouter><Header /><Footer /></MemoryRouter>);

    const logos = screen.getAllByRole('img', { name: /TDB Responde/ });
    expect(logos).toHaveLength(2);
    logos.forEach((logo) => {
      expect(logo).toHaveAttribute('src', '/img/logo-completa.png');
      const size = pngSize(logo.getAttribute('src')!);
      expect(logo).toHaveAttribute('width', String(size.width));
      expect(logo).toHaveAttribute('height', String(size.height));
    });
    expect(screen.getByRole('link', { name: 'Ir para a página inicial' })).toHaveAttribute('href', '/');
    expect(screen.getByAltText('Turma do Bem')).toHaveAttribute('src', '/img/turmadobem.png');
  });

  it('oferece ícones sem texto nos tamanhos declarados para navegador e dispositivo móvel', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const document = new DOMParser().parseFromString(html, 'text/html');
    const favicon = document.querySelector('link[rel="icon"]')!;
    const touchIcon = document.querySelector('link[rel="apple-touch-icon"]')!;

    expect(favicon.getAttribute('type')).toBe('image/png');
    expect(favicon.getAttribute('href')).toBe('/img/favicon.png');
    expect(favicon.getAttribute('sizes')).toBe('64x64');
    expect(pngSize(favicon.getAttribute('href')!)).toEqual({ width: 64, height: 64 });
    expect(touchIcon.getAttribute('sizes')).toBe('180x180');
    expect(pngSize(touchIcon.getAttribute('href')!)).toEqual({ width: 180, height: 180 });
  });
});
