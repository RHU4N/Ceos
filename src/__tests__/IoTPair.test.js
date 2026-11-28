import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import IoTPairDevice from "../presentation/iot/IoTPairDevice";
import { connectionStatus, formatPairingCode, isPairingCodeComplete } from "../presentation/iot/presentation";
import { iotApi } from "../infrastructure/api/iotApi";
jest.mock("../infrastructure/api/iotApi", () => ({
  iotApi: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
afterEach(() => jest.clearAllMocks());

const preview = {
  nomeSugerido: "Estacao meteorologica Wokwi",
  modelo: "ESP32 DevKit + DHT22 + BMP180 (Wokwi)",
  fabricante: "Espressif",
  hardwareId: "24:0a:c4:00:01:10",
  sensores: [
    { sensorId: "dht22-temperatura", nome: "Temperatura DHT22", tipo: "temperatura", unidade: "C" },
    { sensorId: "bmp180-pressao", nome: "Pressão BMP180", tipo: "pressao", unidade: "hPa" },
  ],
  reconnectable: [],
};

test("código é normalizado, sem caracteres ambíguos, e só habilita com 8 caracteres", () => {
  expect(formatPairingCode("k7p4qx9m")).toBe("K7P4-QX9M");
  expect(formatPairingCode("k7p4-qx9m-extra")).toBe("K7P4-QX9M");
  expect(formatPairingCode("O0I1L")).toBe("");
  expect(isPairingCodeComplete("K7P4-QX9")).toBe(false);
  expect(isPairingCodeComplete("k7p4qx9m")).toBe(true);
  expect(connectionStatus("CONECTADO")).toBe("Conectado");
  expect(connectionStatus("AGUARDANDO_MEDICOES")).toBe("Aguardando medições");
  expect(connectionStatus("DESCONECTADO")).toBe("Desconectado");
  expect(connectionStatus("x")).toBe("Estado desconhecido");
});

test("associa digitando o código, confirma os dados do equipamento e nunca mostra tokens", async () => {
  const onPaired = jest.fn();
  iotApi.post
    .mockResolvedValueOnce({ success: true, data: preview })
    .mockResolvedValueOnce({ success: true, data: { device: { deviceId: "ceos-1", nome: "Sala" }, reconnected: false } });
  render(<IoTPairDevice onPaired={onPaired} />);
  const input = screen.getByLabelText("Código exibido no dispositivo");
  const next = screen.getByRole("button", { name: "Continuar" });
  expect(next.disabled).toBe(true);
  fireEvent.change(input, { target: { value: "k7p4qx9m" } });
  expect(input.value).toBe("K7P4-QX9M");
  fireEvent.click(next);
  await waitFor(() => expect(screen.getByText("Confirmar dispositivo")).toBeTruthy());
  expect(iotApi.post).toHaveBeenCalledWith("/iot/claims/lookup", { code: "K7P4-QX9M" });
  expect(screen.getByText(preview.modelo)).toBeTruthy();
  expect(screen.getByText("Temperatura DHT22 (Temperatura, °C)")).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/token/i);
  fireEvent.change(screen.getByLabelText("Nome do dispositivo"), { target: { value: "Sala" } });
  fireEvent.click(screen.getByRole("button", { name: "Associar dispositivo" }));
  await waitFor(() => expect(onPaired).toHaveBeenCalled());
  expect(iotApi.post).toHaveBeenLastCalledWith("/iot/claims/confirm", { code: "K7P4-QX9M", nome: "Sala" });
});

test("código inválido ou expirado mostra a mensagem da API", async () => {
  iotApi.post.mockRejectedValueOnce(new Error("Código de associação inválido ou expirado."));
  render(<IoTPairDevice onPaired={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Código exibido no dispositivo"), { target: { value: "AAAA2222" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Código de associação inválido ou expirado.");
});

test("reconexão envia o deviceId escolhido para manter o histórico", async () => {
  const onPaired = jest.fn();
  iotApi.post
    .mockResolvedValueOnce({ data: { ...preview, reconnectable: [{ deviceId: "ceos-old", nome: "Estação antiga", status: "REVOKED" }] } })
    .mockResolvedValueOnce({ data: { device: { deviceId: "ceos-old" }, reconnected: true } });
  render(<IoTPairDevice onPaired={onPaired} />);
  fireEvent.change(screen.getByLabelText("Código exibido no dispositivo"), { target: { value: "K7P4QX9M" } });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  fireEvent.click(await screen.findByLabelText(/Reconectar “Estação antiga”/));
  fireEvent.click(screen.getByRole("button", { name: "Associar dispositivo" }));
  await waitFor(() => expect(onPaired).toHaveBeenCalled());
  expect(iotApi.post).toHaveBeenLastCalledWith("/iot/claims/confirm", { code: "K7P4-QX9M", nome: "Estação antiga", deviceId: "ceos-old" });
});
