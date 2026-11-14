import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../presentation/context/AuthContext';
import apiClient from '../infrastructure/api/apiClient';
jest.mock('../infrastructure/api/apiClient', () => ({ get: jest.fn(), post: jest.fn() }));

function Session() {
  const { user, login } = useAuth();
  return <><span data-testid="identity">{user?.id || 'guest'}</span><button onClick={() => login({ id: 'account-b' })}>Login B</button></>;
}

test('a late initial session restoration cannot replace a newer login', async () => {
  let finishRestore;
  apiClient.get.mockReturnValue(new Promise(resolve => { finishRestore = resolve; }));
  render(<AuthProvider><Session /></AuthProvider>);
  fireEvent.click(screen.getByText('Login B'));
  expect(screen.getByTestId('identity').textContent).toBe('account-b');
  await act(async () => finishRestore({ data: { data: { id: 'account-a' } } }));
  expect(screen.getByTestId('identity').textContent).toBe('account-b');
  expect(JSON.parse(localStorage.getItem('ceos_user')).id).toBe('account-b');
});
