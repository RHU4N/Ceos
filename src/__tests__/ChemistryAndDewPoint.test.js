import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Quimica from '../presentation/pages/Quimica';
import Solucoes from '../presentation/pages/Solucoes';
import Estequiometria from '../presentation/pages/Estequiometria';
import Termoquimica from '../presentation/pages/Termoquimica';
import PontoDeOrvalho from '../presentation/pages/PontoDeOrvalho';
import { LoadingProvider } from '../presentation/context/LoadingContext';
import ChemistryApiRepository from '../infrastructure/api/ChemistryApiRepository';
import PhysicsApiRepository from '../infrastructure/api/PhysicsApiRepository';
import { iotApi } from '../infrastructure/api/iotApi';
import { saveHistorico } from '../infrastructure/api/historicoClient';

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
  iotApi: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <LoadingProvider>{ui}</LoadingProvider>
    </MemoryRouter>
  );
}

describe('Quimica, Solucoes, Estequiometria, Termoquimica & PontoDeOrvalho', () => {
  beforeEach(() => {
    mockUser = { id: 'user-1', nome: 'Tester' };
    jest.clearAllMocks();
    jest.restoreAllMocks();
    saveHistorico.mockResolvedValue([]);
  });

  test('Quimica enables Estequiometria and Termoquimica links without disabled/Em breve placeholders', () => {
    const { container } = renderWithProviders(<Quimica />);
    expect(screen.queryByText('Em breve')).not.toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- o cartão desabilitado só é identificável pela classe CSS
    expect(container.querySelector('.card-disabled')).toBeNull();

    // eslint-disable-next-line testing-library/no-node-access -- o título está na ilustração; o teste confere o link que a envolve
    const esteqLink = screen.getByTitle('Estequiometria').closest('a');
    // eslint-disable-next-line testing-library/no-node-access -- idem
    const termoLink = screen.getByTitle('Termoquímica').closest('a');
    // eslint-disable-next-line testing-library/no-node-access -- idem
    const solLink = screen.getByTitle('Soluções').closest('a');

    expect(esteqLink).toHaveAttribute('href', '/quimica/estequiometria');
    expect(termoLink).toHaveAttribute('href', '/quimica/termoquimica');
    expect(solLink).toHaveAttribute('href', '/solucoes');
  });

  test('Solucoes densidade input binds to massa (bug fix) and sends massa & volume', async () => {
    const spy = jest
      .spyOn(ChemistryApiRepository.prototype, 'calcular')
      .mockResolvedValue('2 g/mL');

    renderWithProviders(<Solucoes />);

    fireEvent.change(screen.getByLabelText('Operação'), {
      target: { value: 'densidade' },
    });

    const massaInput = screen.getByPlaceholderText('massa (g)');
    const volumeInput = screen.getByPlaceholderText('volume (mL)');

    fireEvent.change(massaInput, { target: { value: '10' } });
    fireEvent.change(volumeInput, { target: { value: '5' } });
    expect(massaInput).toHaveValue(10);

    fireEvent.click(screen.getByRole('button', { name: 'Calcular' }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith({
      action: 'densidade',
      data: { massa: 10, volume: 5 },
    });
    expect(await screen.findByText('2 g/mL')).toBeInTheDocument();
  });

  test('Estequiometria supports balanceamento and reagente-limitante with prefill', async () => {
    const spy = jest
      .spyOn(ChemistryApiRepository.prototype, 'calcularEstequiometria')
      .mockResolvedValueOnce({
        resultado: '2 H2 + O2 -> 2 H2O',
        equacaoBalanceada: '2 H2 + O2 -> 2 H2O',
        reagentes: [
          { formula: 'H2', coeficiente: 2, massaMolar: 2.016 },
          { formula: 'O2', coeficiente: 1, massaMolar: 31.998 },
        ],
        produtos: [{ formula: 'H2O', coeficiente: 2, massaMolar: 18.015 }],
        conservacao: { H: { reagentes: 4, produtos: 4 }, O: { reagentes: 2, produtos: 2 } },
        passos: ['Equação balanceada: 2 H2 + O2 -> 2 H2O'],
        interpretacao: 'Equação balanceada.',
      })
      .mockResolvedValueOnce({
        resultado: 'Reagente limitante: H2 (produzindo 54.045 g (3 mol) de H2O)',
        equacaoBalanceada: '2 H2 + O2 -> 2 H2O',
        empateEstequiometrico: false,
        reagenteLimitante: 'H2',
        reagentesLimitantes: ['H2'],
        analiseReagentes: [
          {
            formula: 'H2',
            molsDisponiveis: 3,
            massaDisponivelG: 6.048,
            molsConsumidos: 3,
            massaConsumidaG: 6.048,
            molsExcesso: 0,
            massaExcessoG: 0,
            limitante: true,
          },
          {
            formula: 'O2',
            molsDisponiveis: 2,
            massaDisponivelG: 63.996,
            molsConsumidos: 1.5,
            massaConsumidaG: 47.997,
            molsExcesso: 0.5,
            massaExcessoG: 15.999,
            limitante: false,
          },
        ],
        produtosGerados: [
          { formula: 'H2O', molsGerados: 3, massaGeradaG: 54.045 },
        ],
        passos: ['H2 limitante'],
        interpretacao: 'Reagente limitante: H2',
      });

    renderWithProviders(<Estequiometria />);

    fireEvent.click(screen.getByRole('button', { name: 'Calcular' }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith({
      action: 'balanceamento',
      data: { equacao: 'H2 + O2 -> H2O' },
    });
    expect(await screen.findByText(/2 H2 \+ O2 -> 2 H2O/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Operação'), {
      target: { value: 'reagente-limitante' },
    });
    fireEvent.change(screen.getByLabelText('Equação química'), {
      target: { value: 'H2 + O2 -> H2O' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preencher reagentes da equação' }));
    fireEvent.change(screen.getByLabelText('Unidade do reagente 1'), { target: { value: 'mols' } });
    fireEvent.change(screen.getByLabelText('Valor do reagente 1'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Unidade do reagente 2'), { target: { value: 'mols' } });
    fireEvent.change(screen.getByLabelText('Valor do reagente 2'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calcular' }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    expect(spy).toHaveBeenLastCalledWith({
      action: 'reagente-limitante',
      data: {
        equacao: 'H2 + O2 -> H2O',
        reagentes: [
          { formula: 'H2', mols: 3 },
          { formula: 'O2', mols: 2 },
        ],
      },
    });
    const esteqResult = await screen.findByRole('region', { name: 'Resultado estequiométrico' });
    expect(within(esteqResult).getByText(/produzindo 54\.045 g/)).toBeInTheDocument();
  });

  test('Termoquimica calculates calor-sensivel (200, 4.18, Ti=20, Tf=30 -> 8360 J / 8.36 kJ)', async () => {
    const spy = jest
      .spyOn(ChemistryApiRepository.prototype, 'calcularTermoquimica')
      .mockResolvedValue({
        resultado: '8360 J (8.36 kJ)',
        valorJ: 8360,
        valorKJ: 8.36,
        deltaT: 10,
        unidade: 'J',
        unidadeAlternativa: 'kJ',
        processo: 'endotermico',
        formula: 'Q = m · c · (Tf − Ti)',
        variaveis: {
          massa: 200,
          calorEspecifico: 4.18,
          temperaturaInicial: 20,
          temperaturaFinal: 30,
          deltaT: 10,
        },
        substituicao: '200 · 4.18 · (30 − 20) = 8360 J',
        passos: ['ΔT = 10 °C', 'Q = 8360 J'],
        interpretacao: 'Processo endotérmico (absorve calor).',
      });

    renderWithProviders(<Termoquimica />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar exemplo' }));
    expect(screen.getByLabelText('Massa (g)')).toHaveValue(200);
    expect(screen.getByLabelText('Calor específico (J/g·°C)')).toHaveValue(4.18);
    expect(screen.getByLabelText('Temperatura inicial Ti (°C)')).toHaveValue(20);
    expect(screen.getByLabelText('Temperatura final Tf (°C)')).toHaveValue(30);

    fireEvent.click(screen.getByRole('button', { name: 'Calcular' }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith({
      action: 'calor-sensivel',
      data: {
        massa: 200,
        calorEspecifico: 4.18,
        temperaturaInicial: 20,
        temperaturaFinal: 30,
      },
    });
    expect(await screen.findByText(/8360 J \(8\.36 kJ\)/)).toBeInTheDocument();
    expect(screen.getByText('200 · 4.18 · (30 − 20) = 8360 J')).toBeInTheDocument();
    expect(screen.getByText(/Processo endotérmico/)).toBeInTheDocument();
  });

  test('PontoDeOrvalho supports Manual mode calculation (T=24, UR=40 -> 9.56 °C)', async () => {
    const spy = jest
      .spyOn(PhysicsApiRepository.prototype, 'calcularTermologia')
      .mockResolvedValue({
        resultado: '9.56 °C',
        pontoOrvalho: 9.56,
        unidade: '°C',
        diferencaOrvalho: 14.44,
        formula: 'γ = ln(UR/100) + (a·T)/(b+T); Td = (b·γ)/(a−γ)',
        variaveis: { T: 24, UR: 40, a: 17.62, b: 243.12 },
        substituicao: 'Td = 9.56 °C',
        passos: ['γ = ...', 'Td ≈ 9.56 °C'],
        interpretacao: 'Ar relativamente seco; baixa probabilidade de condensação nas condições atuais.',
      });

    renderWithProviders(<PontoDeOrvalho />);

    fireEvent.change(screen.getByLabelText('Temperatura (°C)'), { target: { value: '24' } });
    fireEvent.change(screen.getByLabelText('Umidade relativa (%)'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calcular' }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith({
      action: 'ponto-de-orvalho',
      data: { temperatura: 24, umidadeRelativa: 40, origem: 'manual' },
    });
    const dewResult = await screen.findByRole('region', { name: 'Resultado do ponto de orvalho' });
    expect(within(dewResult).getByText('9.56 °C')).toBeInTheDocument();
    expect(saveHistorico).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'Fisica:Termologia:PontoDeOrvalho',
      })
    );
  });

  test('PontoDeOrvalho IoT mode pairs stale event, supports READ_ONCE polling, and blocks incomplete readings', async () => {
    jest.useFakeTimers();
    const oldTs = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const newTs = new Date().toISOString();

    const device = {
      deviceId: 'ceos-station-1',
      nome: 'Estação Lab',
      status: 'ACTIVE',
      historyOnly: false,
      capacidades: { supportsOnDemand: true, supportsCommandPolling: true, supportsPush: true },
      sensores: [
        { sensorId: 'dht22-temperatura', nome: 'Temp DHT22', tipo: 'temperatura', unidade: 'C' },
        { sensorId: 'dht22-umidade', nome: 'Umid DHT22', tipo: 'umidade', unidade: '%' },
      ],
    };

    const oldMeasurements = [
      {
        deviceId: 'ceos-station-1',
        sensorId: 'dht22-temperatura',
        sensorTipo: 'temperatura',
        valor: 24,
        unidade: 'C',
        timestamp: oldTs,
        metadata: { eventId: 'ev-old', physicalSensorId: 'dht22', origin: 'PUSH' },
      },
      {
        deviceId: 'ceos-station-1',
        sensorId: 'dht22-umidade',
        sensorTipo: 'umidade',
        valor: 40,
        unidade: '%',
        timestamp: oldTs,
        metadata: { eventId: 'ev-old', physicalSensorId: 'dht22', origin: 'PUSH' },
      },
    ];

    const newMeasurements = [
      {
        deviceId: 'ceos-station-1',
        sensorId: 'dht22-temperatura',
        sensorTipo: 'temperatura',
        valor: 26,
        unidade: 'C',
        timestamp: newTs,
        metadata: { eventId: 'ev-fresh', physicalSensorId: 'dht22', origin: 'READ_ONCE' },
      },
      {
        deviceId: 'ceos-station-1',
        sensorId: 'dht22-umidade',
        sensorTipo: 'umidade',
        valor: 50,
        unidade: '%',
        timestamp: newTs,
        metadata: { eventId: 'ev-fresh', physicalSensorId: 'dht22', origin: 'READ_ONCE' },
      },
    ];

    iotApi.get.mockImplementation(async (path) => {
      if (path === '/iot/devices') return { data: [device] };
      if (path === '/iot/measurements') return { data: oldMeasurements };
      if (path === '/iot/requests/req-1') {
        return { data: { requestId: 'req-1', status: 'COMPLETED', resultEventId: 'ev-fresh' } };
      }
      if (path === '/iot/events/ev-fresh') return { data: newMeasurements };
      return { data: [] };
    });

    iotApi.post.mockResolvedValue({ data: { requestId: 'req-1', status: 'QUEUED' } });

    const physSpy = jest
      .spyOn(PhysicsApiRepository.prototype, 'calcularTermologia')
      .mockResolvedValue({
        resultado: '14.76 °C',
        pontoOrvalho: 14.76,
        unidade: '°C',
      });

    renderWithProviders(<PontoDeOrvalho />);

    fireEvent.click(screen.getByRole('tab', { name: 'Modo IoT' }));

    expect(await screen.findByText(/Atenção: esta medição é antiga/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar nova leitura (READ_ONCE)' }));

    await waitFor(() =>
      expect(iotApi.post).toHaveBeenCalledWith(
        '/iot/devices/ceos-station-1/requests',
        {},
        expect.any(String)
      )
    );

    await act(async () => {
      jest.advanceTimersByTime(2600);
    });

    expect(await screen.findByText('26 °C')).toBeInTheDocument();
    expect(screen.getByText('50 %')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Calcular Ponto de Orvalho (IoT)' }));

    await waitFor(() =>
      expect(physSpy).toHaveBeenCalledWith({
        action: 'ponto-de-orvalho',
        data: { temperatura: 26, umidadeRelativa: 50, origem: 'iot' },
      })
    );
    const iotResult = await screen.findByRole('region', { name: 'Resultado do ponto de orvalho' });
    expect(within(iotResult).getByText('14.76 °C')).toBeInTheDocument();

    jest.useRealTimers();
  });

  test('PontoDeOrvalho IoT mode blocks calculation when selected event is incomplete', async () => {
    const device = {
      deviceId: 'ceos-station-2',
      nome: 'Estação Incompleta',
      status: 'ACTIVE',
      capacidades: { supportsOnDemand: false },
      sensores: [{ sensorId: 'dht22-temperatura', nome: 'Temp', tipo: 'temperatura', unidade: 'C' }],
    };

    iotApi.get.mockImplementation(async (path) => {
      if (path === '/iot/devices') return { data: [device] };
      if (path === '/iot/measurements') {
        return {
          data: [
            {
              deviceId: 'ceos-station-2',
              sensorId: 'dht22-temperatura',
              sensorTipo: 'temperatura',
              valor: 23,
              unidade: 'C',
              timestamp: new Date().toISOString(),
              metadata: { eventId: 'ev-inc' },
            },
          ],
        };
      }
      return { data: [] };
    });

    renderWithProviders(<PontoDeOrvalho />);
    fireEvent.click(screen.getByRole('tab', { name: 'Modo IoT' }));

    expect(
      await screen.findByText(/Medição incompleta: este evento não possui temperatura e umidade simultâneas\./)
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Atualizar leituras' })).not.toBeDisabled()
    );
    expect(screen.getByRole('button', { name: 'Calcular Ponto de Orvalho (IoT)' })).toBeDisabled();
  });
});
