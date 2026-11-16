import { cacheUser, readUserCache, syncHistory } from '../infrastructure/api/userCache';
import { saveHistorico, fetchHistorico } from '../infrastructure/api/historicoClient';
import apiClient from '../infrastructure/api/apiClient';
jest.mock('../infrastructure/api/apiClient', () => ({ get: jest.fn(), post: jest.fn() }));

beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });
test('cache retains only the history owner and history, without profile or credentials', () => {
  cacheUser({ id: 'a', email: 'private@example.test', telefone: '123', token: 'secret', historico: [1] });
  expect(readUserCache()).toEqual({ id: 'a', historico: [1] });
});
test('late history updates cannot replace a different account cache', () => {
  cacheUser({ id: 'b', historico: [2] });
  expect(syncHistory('a', [1])).toBe(false);
  expect(readUserCache().historico).toEqual([2]);
});
test('a history response from a previous owner is discarded', async () => {
  cacheUser({ id: 'a' });
  let finish;
  apiClient.get.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const pending = fetchHistorico();
  cacheUser({ id: 'b' });
  finish({ data: { data: ['private-a'] } });
  expect(await pending).toEqual([]);
});
test('a save completed after switching accounts does not fetch or update the new account', async () => {
  cacheUser({ id: 'a' });
  let finish;
  apiClient.post.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const pending = saveHistorico({ tipo: 'test', valores: '', resultado: '' });
  cacheUser({ id: 'b', historico: [2] });
  finish({ data: { data: {} } });
  expect(await pending).toEqual([]);
  expect(apiClient.get).not.toHaveBeenCalled();
  expect(readUserCache().historico).toEqual([2]);
});
