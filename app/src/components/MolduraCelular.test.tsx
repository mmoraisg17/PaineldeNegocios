import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { MolduraCelular, escalaDaMoldura } from './MolduraCelular';

test('não amplia o aparelho em telas altas', () => {
  expect(escalaDaMoldura(1200)).toBe(1);
});

test('reduz o aparelho para caber num notebook de 768 px de altura', () => {
  // (768 - 48) / 868 ≈ 0,83
  expect(escalaDaMoldura(768)).toBeCloseTo(0.829, 2);
});

test('não reduz o aparelho a ponto de ficar ilegível', () => {
  expect(escalaDaMoldura(200)).toBe(0.5);
});

test('renderiza o conteúdo dentro da tela do aparelho', () => {
  // Arrange / Act
  const { container } = render(
    <MolduraCelular>
      <p>conteúdo do app</p>
    </MolduraCelular>,
  );

  // Assert
  const tela = container.querySelector('[data-tela]');
  expect(tela).not.toBeNull();
  expect(tela).toContainElement(screen.getByText('conteúdo do app'));
});

test('traz o aviso de protótipo para a visualização no computador', () => {
  // Arrange / Act
  render(
    <MolduraCelular>
      <p>x</p>
    </MolduraCelular>,
  );

  // Assert: o aviso existe; quem o esconde no celular é o CSS (.moldura-aviso)
  expect(screen.getByRole('complementary', { name: 'Sobre esta visualização' })).toBeInTheDocument();
});
