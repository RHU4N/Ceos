import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Link, Route, Routes } from "react-router-dom";
import IoTChart from "../presentation/iot/IoTChart";
import IoTDashboard from "../presentation/iot/IoTDashboard";
import IoTDeviceSetup from "../presentation/iot/IoTDeviceSetup";
import {
  IoTNotificationBell,
  IoTNotificationProvider,
} from "../presentation/iot/IoTNotificationProvider";
import { iotApi } from "../infrastructure/api/iotApi";
jest.mock("../presentation/context/AuthContext", () => {
  const user = { id: "test-owner" };
  return { useAuth: () => ({ user }) };
});
jest.mock("../infrastructure/api/iotApi", () => ({
  iotApi: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
test("charts preserve sensor and unit boundaries, dates, axes, tooltip and empty state", () => {
  const sensor = { sensorId: "temp", nome: "Temperature", unidade: "C" };
  const { container, rerender } = render(
    <IoTChart sensor={sensor} measurements={[]} />,
  );
  expect(screen.getByText("Sem medições para Temperature.")).toBeTruthy();
  rerender(
    <IoTChart
      sensor={sensor}
      measurements={[
        {
          id: "1",
          sensorId: "temp",
          valor: 23,
          unidade: "C",
          timestamp: "2026-11-14T10:00:00Z",
        },
        {
          id: "2",
          sensorId: "humid",
          valor: 89,
          unidade: "%",
          timestamp: "2026-11-14T10:00:00Z",
        },
      ]}
    />,
  );
  expect(container.querySelectorAll("circle").length).toBe(1);
  expect(container.querySelector("circle title").textContent).toContain(
    "23 °C",
  );
  expect(container.querySelector("svg path")).toBeTruthy();
});
test("device registration sends the edited sensor contract and receives single-use provisioning", async () => {
  iotApi.post.mockResolvedValue({
    data: { device: { deviceId: "ceos-test" }, provisioningToken: "one-time" },
  });
  const saved = jest.fn();
  render(<IoTDeviceSetup onSaved={saved} />);
  fireEvent.change(screen.getByLabelText("Nome"), {
    target: { value: "My station" },
  });
  fireEvent.change(screen.getByLabelText("Sensores (JSON editável)"), {
    target: {
      value: JSON.stringify([
        { sensorId: "light", nome: "Luz", tipo: "luz", unidade: "lux" },
      ]),
    },
  });
  fireEvent.click(screen.getByText("Cadastrar e gerar pareamento"));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(iotApi.post.mock.calls[0][1].sensores).toEqual([
    { sensorId: "light", nome: "Luz", tipo: "luz", unidade: "lux" },
  ]);
});
test("one global poll survives navigation, announces completion and opens persisted result", async () => {
  jest.useFakeTimers();
  let completed = false;
  const notification = {
    notificationId: "note",
    relatedRequestId: "request",
    type: "IOT_READ_COMPLETED",
    title: "Sua leitura foi concluída.",
    message: "Ver resultado",
  };
  iotApi.get.mockImplementation(async (path) => ({
    data: path.endsWith("unread-count")
      ? { count: completed ? 1 : 0 }
      : { items: completed ? [notification] : [] },
  }));
  iotApi.patch.mockResolvedValue({});
  render(
    <MemoryRouter>
      <IoTNotificationProvider>
        <IoTNotificationBell />
        <Link to="/calculadora">Calculadora</Link>
        <Routes>
          <Route path="/" element={<p>Dashboard</p>} />
          <Route path="/calculadora" element={<p>Continuar calculando</p>} />
          <Route path="/iot" element={<p>Resultado persistido</p>} />
        </Routes>
      </IoTNotificationProvider>
    </MemoryRouter>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("Calculadora"));
  expect(screen.getByText("Continuar calculando")).toBeTruthy();
  completed = true;
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(screen.getByRole("status").textContent).toContain(
    "Sua leitura foi concluída.",
  );
  fireEvent.click(screen.getByRole("link", { name: "Ver resultado" }));
  await act(async () => {});
  expect(screen.getByText("Resultado persistido")).toBeTruthy();
  expect(iotApi.patch).toHaveBeenCalledWith("/notifications/note/read", {});
});

test("unlinked device history stays visible while reading controls remain disabled", async () => {
  const sensor = {
    sensorId: "temp",
    nome: "Temperature",
    tipo: "temperatura",
    unidade: "C",
  };
  const device = {
    deviceId: "archived",
    nome: "Archived station",
    status: "ARCHIVED",
    historyOnly: true,
    sensores: [sensor],
    capacidades: { supportsPush: false },
  };
  const row = {
    id: "row",
    deviceId: "archived",
    sensorId: "temp",
    sensorTipo: "temperatura",
    valor: 22,
    unidade: "C",
    timestamp: "2026-11-14T10:00:00Z",
    metadata: { eventId: "event" },
  };
  iotApi.get.mockImplementation(async (path) =>
    path === "/iot/devices"
      ? { data: [device] }
      : path === "/iot/requests"
        ? { data: { items: [], pagination: { totalPages: 0 } } }
        : { data: [row], pagination: { page: 1, total: 1, totalPages: 1 } },
  );
  render(
    <MemoryRouter>
      <IoTDashboard />
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText(/^Somente hist/)).toBeTruthy());
  expect(
    screen.getByRole("button", { name: "Solicitar leitura" }).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: /^Hist/ }));
  await waitFor(() => expect(screen.getByText(/^22 /)).toBeTruthy());
  expect(screen.getByText("Abrir leitura")).toBeTruthy();
});
