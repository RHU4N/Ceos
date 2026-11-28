import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Navbar from '../presentation/components/Navbar';
import ForgotPassword from '../presentation/pages/ForgotPassword';
import Funcao from '../presentation/pages/Funcao';
import Home from '../presentation/pages/Home';
import Login from '../presentation/pages/Login';
import Register from '../presentation/pages/Register';
import FAQ from '../presentation/pages/FAQ';
import FuncoesPersonalizadas from '../presentation/pages/FuncoesPersonalizadas';
import { LoadingProvider } from '../presentation/context/LoadingContext';
import { IoTNotificationBell, IoTNotificationProvider } from '../presentation/iot/IoTNotificationProvider';
import { iotApi } from '../infrastructure/api/iotApi';
import apiClient from '../infrastructure/api/apiClient';
import * as customFunctionsClient from '../infrastructure/api/customFunctionsClient';

let mockUser = null;
const mockLogin = jest.fn();
const mockUpdateUser = jest.fn();
const mockLogout = jest.fn();

jest.mock('../presentation/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    login: mockLogin,
    updateUser: mockUpdateUser,
    logout: mockLogout,
  }),
}));

jest.mock('../presentation/context/FavoritesContext', () => ({
  useFavorites: () => ({
    favorites: [],
    isFavorited: () => false,
    toggleFavorite: jest.fn(),
  }),
}));

jest.mock('../infrastructure/api/iotApi', () => ({
  iotApi: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

jest.mock('../infrastructure/api/customFunctionsClient', () => ({
  listCustomFunctions: jest.fn().mockResolvedValue([]),
  getCustomFunction: jest.fn(),
  createCustomFunction: jest.fn(),
  updateCustomFunction: jest.fn(),
  deleteCustomFunction: jest.fn(),
  validateCustomFunction: jest.fn(),
  executeCustomFunction: jest.fn(),
}));

describe('QA Visual and Accessibility Fixes', () => {
  beforeAll(() => {
    if (typeof global.IntersectionObserver === 'undefined') {
      global.IntersectionObserver = class IntersectionObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  });

  beforeEach(() => {
    mockUser = null;
    jest.clearAllMocks();
    customFunctionsClient.listCustomFunctions.mockResolvedValue([]);
    iotApi.get.mockResolvedValue({ data: { items: [], count: 0 } });
  });

  test('BUG-01: ForgotPassword renders fallback content and exits cleanly without nested main', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Recuperar Senha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Central de Ajuda' })).toHaveAttribute('href', '/faq');
  });

  test('BUG-02/08/12: Navbar provides semantic dropdown, hamburger toggle, functional Planos link, and TTS aria-pressed', () => {
    render(
      <MemoryRouter>
        <LoadingProvider>
          <Navbar />
        </LoadingProvider>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Abrir menu de navegação/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(toggleBtn).toHaveAttribute('aria-controls', 'ceos-primary-nav');
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Fechar menu de navegação/i })).toHaveAttribute('aria-expanded', 'true');

    const studyBtn = screen.getByRole('button', { name: /Ambiente de Estudo/i });
    expect(studyBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(studyBtn);
    expect(studyBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(studyBtn).toHaveAttribute('aria-expanded', 'false');

    expect(screen.getByRole('link', { name: 'Planos' })).toHaveAttribute('href', '/faq#planos');

    const ttsBtn = screen.getByRole('button', { name: /TTS: OFF/i });
    expect(ttsBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(ttsBtn);
    expect(screen.getByRole('button', { name: /TTS: ON/i })).toHaveAttribute('aria-pressed', 'true');
  });

  test('BUG-03: Funcao associates Tipo de Função label with select control', () => {
    render(
      <MemoryRouter>
        <LoadingProvider>
          <Funcao />
        </LoadingProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Tipo de Função');
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('funcao1');
  });

  test('BUG-07: IoTNotificationBell matches WCAG 2.5.3 label-content-name-mismatch', async () => {
    mockUser = { id: 'u-1', nome: 'Maria' };
    iotApi.get.mockImplementation(async (path) => ({
      data: path.endsWith('unread-count') ? { count: 2 } : { items: [] },
    }));
    render(
      <MemoryRouter>
        <IoTNotificationProvider>
          <IoTNotificationBell />
        </IoTNotificationProvider>
      </MemoryRouter>
    );

    const bell = await screen.findByRole('link', { name: /^Meu IoT \(2\)/ });
    expect(bell).toHaveAttribute('aria-label', 'Meu IoT (2): 2 notificações não lidas');
  });

  test('BUG-09/12: Home avoids nested buttons inside links and Login/Register avoid duplicate main and expose role=alert', async () => {
    const { container: homeContainer } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- verifica a ausência de elementos interativos aninhados (sem consulta acessível equivalente)
    expect(homeContainer.querySelector('a button, button a')).toBeNull();
    expect(screen.getByRole('link', { name: /Saiba Mais/i })).toHaveAttribute('href', '/faq#planos');

    const postSpy = jest.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Credenciais inválidas'));
    render(
      <MemoryRouter>
        <LoadingProvider>
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        </LoadingProvider>
      </MemoryRouter>
    );
    expect(screen.queryByRole('main')).toBeNull();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciais inválidas');
    postSpy.mockRestore();

    render(
      <MemoryRouter>
        <LoadingProvider>
          <Register />
        </LoadingProvider>
      </MemoryRouter>
    );
    expect(screen.queryByRole('main')).toBeNull();
  });

  test('BUG-10: EditProfileModal exposes accessible dialog semantics, labeled inputs, and Escape dismissal', async () => {
    mockUser = { id: 'u-1', nome: 'Usuário QA', email: 'qa@example.com', telefone: '11999990000' };
    render(
      <MemoryRouter>
        <LoadingProvider>
          <Navbar />
        </LoadingProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Editar perfil: Usuário QA/i }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('Usuário QA');
    expect(within(dialog).getByLabelText('E-mail')).toBeDisabled();
    expect(within(dialog).getByLabelText('Telefone')).toHaveValue('11999990000');

    const novaSenha = within(dialog).getByLabelText('Nova senha');
    fireEvent.change(novaSenha, { target: { value: 'NovaSenha!123' } });
    expect(within(dialog).getByLabelText(/Senha atual/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Confirmar nova senha/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('BUG-11/12: FuncoesPersonalizadas places heading outside flex row and FAQ expands #planos on hash navigation', async () => {
    mockUser = { id: 'u-1', nome: 'Usuário QA' };
    render(
      <MemoryRouter initialEntries={['/funcoes-personalizadas']}>
        <FuncoesPersonalizadas />
      </MemoryRouter>
    );

    await waitFor(() => expect(customFunctionsClient.listCustomFunctions).toHaveBeenCalled());
    const heading = screen.getByRole('heading', { level: 1, name: 'Funções Personalizadas' });
    // eslint-disable-next-line testing-library/no-node-access -- garante que o título não está dentro da grade de cartões (estrutura de layout)
    expect(heading.closest('.row.g-4')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).not.toHaveTextContent('Matemática');

    render(
      <MemoryRouter initialEntries={['/faq#planos']}>
        <FAQ />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /plano gratuito/i })).toHaveAttribute('aria-expanded', 'true');
  });
});
