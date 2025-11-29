import CalcularFinanceiro from '../domain/usecases/CalcularFinanceiro';

describe('CalcularFinanceiro usecase', () => {
  test('calls repository calcularFinanceiro and returns its result', async () => {
    const mockResult = { resultado: 5 };
    const mockRepo = { calcularFinanceiro: jest.fn().mockResolvedValue(mockResult) };

    const usecase = new CalcularFinanceiro(mockRepo);
    const params = { tipo: 'variacao', data: { p: 10, v: 15 } };

    const res = await usecase.execute(params);

    expect(mockRepo.calcularFinanceiro).toHaveBeenCalledWith(params);
    expect(res).toBe(mockResult);
  });

  test('propagates repository errors', async () => {
    const error = new Error('fail');
    const mockRepo = { calcularFinanceiro: jest.fn().mockRejectedValue(error) };
    const usecase = new CalcularFinanceiro(mockRepo);
    await expect(usecase.execute({ tipo: 'juros-simples', data: { c: 100, i: 0.1, n: 2 } })).rejects.toThrow('fail');
  });
});
