import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FavoritesProvider } from '../presentation/context/FavoritesContext';
import FavoriteButton from '../presentation/components/FavoriteButton';
import Favoritos from '../presentation/pages/Favoritos';
import FuncoesPersonalizadas from '../presentation/pages/FuncoesPersonalizadas';
import CatalogoCalculadoras from '../presentation/pages/CatalogoCalculadoras';
import {
  AREAS,
  CALCULATORS,
  getCalculatorByKey,
  getCalculatorByResourceId,
  getCalculatorRoute,
} from '../constants/calculatorCatalog';
import * as favoritesClient from '../infrastructure/api/favoritesClient';
import * as customFunctionsClient from '../infrastructure/api/customFunctionsClient';
import { saveHistorico } from '../infrastructure/api/historicoClient';

let mockUser = { id: 'user-1', nome: 'Maria' };

jest.mock('../presentation/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock('../infrastructure/api/favoritesClient', () => ({
  listFavorites: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

jest.mock('../infrastructure/api/customFunctionsClient', () => ({
  listCustomFunctions: jest.fn(),
  getCustomFunction: jest.fn(),
  createCustomFunction: jest.fn(),
  updateCustomFunction: jest.fn(),
  deleteCustomFunction: jest.fn(),
  validateCustomFunction: jest.fn(),
  executeCustomFunction: jest.fn(),
}));

jest.mock('../infrastructure/api/historicoClient', () => ({
  saveHistorico: jest.fn().mockResolvedValue([]),
}));

describe('Favorites and Custom Functions', () => {
  beforeEach(() => {
    mockUser = { id: 'user-1', nome: 'Maria' };
    jest.clearAllMocks();
    favoritesClient.listFavorites.mockResolvedValue([]);
    customFunctionsClient.listCustomFunctions.mockResolvedValue([]);
    saveHistorico.mockResolvedValue([]);
  });

  test('FavoriteButton adds and removes favorites and warns when unauthenticated', async () => {
    favoritesClient.addFavorite.mockResolvedValue({
      id: 'fav-1',
      resourceId: 'calc:quimica:estequiometria',
      resourceType: 'calculation',
      nome: 'Estequiometria',
      descricao: 'Balanceamento',
    });
    favoritesClient.removeFavorite.mockResolvedValue();

    render(
      <MemoryRouter>
        <FavoritesProvider>
          <FavoriteButton
            resourceId="calc:quimica:estequiometria"
            resourceType="calculation"
            nome="Estequiometria"
            descricao="Balanceamento"
          />
        </FavoritesProvider>
      </MemoryRouter>
    );

    const btn = await screen.findByRole('button', { name: 'Favoritar' });
    fireEvent.click(btn);

    await waitFor(() =>
      expect(favoritesClient.addFavorite).toHaveBeenCalledWith({
        resourceId: 'calc:quimica:estequiometria',
        resourceType: 'calculation',
        nome: 'Estequiometria',
        descricao: 'Balanceamento',
      })
    );
    expect(await screen.findByRole('button', { name: 'Favoritado' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Favoritado' }));
    await waitFor(() => expect(favoritesClient.removeFavorite).toHaveBeenCalledWith('fav-1'));
    expect(await screen.findByRole('button', { name: 'Favoritar' })).toBeInTheDocument();

    // Unauthenticated click warns cleanly without calling API
    mockUser = null;
    render(
      <MemoryRouter>
        <FavoritesProvider>
          <FavoriteButton resourceId="calc:matematica:funcao" nome="Função" />
        </FavoritesProvider>
      </MemoryRouter>
    );

    const guestBtns = screen.getAllByRole('button', { name: 'Favoritar' });
    fireEvent.click(guestBtns[guestBtns.length - 1]);
    expect(await screen.findByText(/Entre na sua conta para salvar favoritos\./)).toBeInTheDocument();
  });

  test('Favoritos page lists items, navigates to calculation/custom-function routes, and removes item', async () => {
    favoritesClient.listFavorites.mockResolvedValue([
      {
        id: 'fav-calc',
        resourceId: 'calc:fisica:termologia:ponto-de-orvalho',
        resourceType: 'calculation',
        nome: 'Ponto de Orvalho',
        descricao: 'Magnus',
      },
      {
        id: 'fav-fn',
        resourceId: 'fn-99',
        resourceType: 'custom-function',
        nome: 'Minha Energia',
        descricao: '0.5 * m * v^2',
      },
    ]);
    favoritesClient.removeFavorite.mockResolvedValue();

    render(
      <MemoryRouter initialEntries={['/favoritos']}>
        <FavoritesProvider>
          <Routes>
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/fisica/termologia/ponto-de-orvalho" element={<div>Página Ponto de Orvalho</div>} />
          </Routes>
        </FavoritesProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Ponto de Orvalho')).toBeInTheDocument();
    expect(screen.getByText('Minha Energia')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: 'Remover' });
    fireEvent.click(removeButtons[1]);
    await waitFor(() => expect(favoritesClient.removeFavorite).toHaveBeenCalledWith('fav-fn'));
    await waitFor(() => expect(screen.queryByText('Minha Energia')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(await screen.findByText('Página Ponto de Orvalho')).toBeInTheDocument();
  });

  test('FuncoesPersonalizadas creates, edits, executes, and deletes custom functions', async () => {
    const createdFn = {
      id: 'fn-1',
      nome: 'Energia Cinética',
      descricao: 'Cálculo de energia',
      categoria: 'fisica',
      tipo: 'formula',
      formula: '0.5 * m * v^2',
      parametros: [
        { nome: 'm', obrigatorio: true },
        { nome: 'v', obrigatorio: true },
      ],
      usos: 0,
    };

    const updatedFn = { ...createdFn, nome: 'Energia Cinética Atualizada' };

    customFunctionsClient.listCustomFunctions.mockResolvedValue([]);
    customFunctionsClient.validateCustomFunction.mockResolvedValue({
      valida: true,
      variaveisDetectadas: ['m', 'v'],
    });
    customFunctionsClient.createCustomFunction.mockResolvedValue(createdFn);
    customFunctionsClient.updateCustomFunction.mockResolvedValue(updatedFn);
    customFunctionsClient.executeCustomFunction.mockResolvedValue({
      id: 'fn-1',
      resultado: 25,
      resultadoFormatado: '25',
      substituicao: '0.5 * 2 * 5^2',
      usos: 1,
    });
    customFunctionsClient.deleteCustomFunction.mockResolvedValue();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/funcoes-personalizadas']}>
        <FavoritesProvider>
          <FuncoesPersonalizadas />
        </FavoritesProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(customFunctionsClient.listCustomFunctions).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Energia Cinética' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'fisica' } });
    fireEvent.change(screen.getByLabelText('Fórmula'), { target: { value: '0.5 * m * v^2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Detectar parâmetros da fórmula' }));

    expect(await screen.findByText(/Parâmetros detectados: m, v/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Validar fórmula' }));
    await waitFor(() =>
      expect(customFunctionsClient.validateCustomFunction).toHaveBeenCalledWith({
        formula: '0.5 * m * v^2',
        parametros: [
          { nome: 'm', obrigatorio: true },
          { nome: 'v', obrigatorio: true },
        ],
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar função' }));
    await waitFor(() => expect(customFunctionsClient.createCustomFunction).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Energia Cinética')).toBeInTheDocument();

    // Edit
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Energia Cinética Atualizada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar função' }));

    await waitFor(() => expect(customFunctionsClient.updateCustomFunction).toHaveBeenCalledWith('fn-1', expect.objectContaining({
      nome: 'Energia Cinética Atualizada',
    })));
    expect(await screen.findByText('Energia Cinética Atualizada')).toBeInTheDocument();

    // Execute
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }));
    const execForm = screen.getByRole('form', { name: 'Executar função personalizada' });
    fireEvent.change(within(execForm).getByLabelText(/^m\b/), { target: { value: '2' } });
    fireEvent.change(within(execForm).getByLabelText(/^v\b/), { target: { value: '5' } });
    fireEvent.click(within(execForm).getByRole('button', { name: 'Executar fórmula' }));

    await waitFor(() =>
      expect(customFunctionsClient.executeCustomFunction).toHaveBeenCalledWith('fn-1', { m: 2, v: 5 })
    );
    expect(await screen.findByText('0.5 * 2 * 5^2')).toBeInTheDocument();
    expect(saveHistorico).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'FuncaoPersonalizada:Energia Cinética Atualizada',
        resultado: '25',
      })
    );

    // Delete
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(customFunctionsClient.deleteCustomFunction).toHaveBeenCalledWith('fn-1'));
    await waitFor(() =>
      expect(screen.queryByText('Energia Cinética Atualizada')).not.toBeInTheDocument()
    );
  });

  test('CatalogoCalculadoras renders all 12 canonical calculators and filters by area/search', async () => {
    render(
      <MemoryRouter>
        <FavoritesProvider>
          <CatalogoCalculadoras />
        </FavoritesProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(favoritesClient.listFavorites).toHaveBeenCalled());
    expect(screen.getByText('Todas (12)')).toBeInTheDocument();
    expect(screen.getByText('Ponto de Orvalho')).toBeInTheDocument();
    expect(screen.getByText('Estequiometria')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar calculadora'), {
      target: { value: 'Magnus' },
    });
    expect(screen.getByText('Ponto de Orvalho')).toBeInTheDocument();
    expect(screen.queryByText('Matrizes')).not.toBeInTheDocument();
  });

  test('calculatorCatalog exposes canonical 12 calculators and lookup helpers', () => {
    expect(AREAS.map((a) => a.key)).toEqual(['matematica', 'fisica', 'quimica']);
    expect(CALCULATORS).toHaveLength(12);
    expect(getCalculatorByKey('ponto-de-orvalho')?.resourceId).toBe(
      'calc:fisica:termologia:ponto-de-orvalho'
    );
    expect(getCalculatorByResourceId('calc:quimica:estequiometria')?.route).toBe(
      '/quimica/estequiometria'
    );
    expect(getCalculatorRoute('calc:quimica:termoquimica')).toBe('/quimica/termoquimica');
    expect(getCalculatorRoute('calc:unknown')).toBeNull();
  });
});
