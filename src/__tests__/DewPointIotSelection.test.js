import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PontoDeOrvalho from '../presentation/pages/PontoDeOrvalho';
import { LoadingProvider } from '../presentation/context/LoadingContext';
import { iotApi } from '../infrastructure/api/iotApi';

let mockUser = { id: 'user-1', nome: 'Tester' };

jest.mock('../presentation/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock('../presentation/context/FavoritesContext', () => ({
  useFavorites: () => ({
    favorites: [],
    isFavorited: () => false,
    toggleFavorite: jest.fn(),
  }),
}));

jest.mock('../infrastructure/api/historicoClient', () => ({
  saveHistorico: jest.fn().mockResolvedValue([]),
}));

jest.mock('../infrastructure/api/iotApi', () => ({
  iotApi: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const device = {
  deviceId: 'ceos-station-1',
  nome: 'Estacao',
  status: 'ACTIVE',
  capacidades: { supportsOnDemand: false },
  sensores: [
    { sensorId: 'dht22-temperatura', nome: 'Temp', tipo: 'temperatura', unidade: 'C' },
    { sensorId: 'dht22-umidade', nome: 'Umid', tipo: 'umidade', unidade: '%' },
  ],
};

const row = (eventId, sensorId, tipo, valor, unidade, iso) => ({
  deviceId: 'ceos-station-1',
  sensorId,
  sensorTipo: tipo,
  valor,
  unidade,
  timestamp: iso,
  metadata: { eventId },
});

const now = Date.now();
const rows = [
  // evento mais recente (padrão ao carregar)
  row('ev-new', 'dht22-temperatura', 'temperatura', 25, 'C', new Date(now - 1000).toISOString()),
  row('ev-new', 'dht22-umidade', 'umidade', 50, '%', new Date(now - 1000).toISOString()),
  // evento anterior, escolhido manualmente
  row('ev-old', 'dht22-temperatura', 'temperatura', 24, 'C', new Date(now - 60000).toISOString()),
  row('ev-old', 'dht22-umidade', 'umidade', 40, '%', new Date(now - 60000).toISOString()),
];

function tree() {
  return (
    <MemoryRouter>
      <LoadingProvider>
        <PontoDeOrvalho />
      </LoadingProvider>
    </MemoryRouter>
  );
}

describe('PontoDeOrvalho IoT: seleção do evento sobrevive à atualização do objeto user', () => {
  beforeEach(() => {
    mockUser = { id: 'user-1', nome: 'Tester' };
    jest.clearAllMocks();
    iotApi.get.mockImplementation(async (path) => {
      if (path === '/iot/devices') return { data: [device] };
      if (path === '/iot/measurements') return { data: rows };
      return { data: [] };
    });
  });

  test('salvar histórico (novo objeto user com o mesmo id) não recarrega nem reseta o evento escolhido', async () => {
    const { rerender } = render(tree());
    fireEvent.click(screen.getByRole('tab', { name: 'Modo IoT' }));

    const select = await screen.findByLabelText(/Evento de medição/);
    await waitFor(() => expect(select.value).toBe('ev-new'));

    fireEvent.change(select, { target: { value: 'ev-old' } });
    expect(await screen.findByText('24 °C')).toBeInTheDocument();
    expect(screen.getByText('40 %')).toBeInTheDocument();

    const measurementCalls = () =>
      iotApi.get.mock.calls.filter(([path]) => path === '/iot/measurements').length;
    const before = measurementCalls();

    // O AuthContext troca o objeto user ao salvar histórico (evento ceos:historicoUpdated).
    mockUser = { ...mockUser, historico: [{ tipo: 'Fisica:Termologia:PontoDeOrvalho' }] };
    rerender(tree());
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(measurementCalls()).toBe(before);
    expect(screen.getByLabelText(/Evento de medição/).value).toBe('ev-old');
    expect(screen.getByText('24 °C')).toBeInTheDocument();
    expect(screen.getByText('40 %')).toBeInTheDocument();
  });
});
