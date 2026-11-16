import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import SiteImage from '../presentation/components/SiteImage';
test('retains local assets until the integration is enabled', () => {
  delete process.env.REACT_APP_SITE_ASSETS_MODE;
  render(<SiteImage src="/logo.png" alt="Logo" className="brand" />);
  expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/logo.png');
});
test('uses the backend gateway and falls back if storage is unavailable', () => {
  process.env.REACT_APP_SITE_ASSETS_MODE = 'azure';
  render(<SiteImage src="/logo.png" alt="Logo" className="brand" />);
  const img = screen.getByAltText('Logo');
  expect(img.getAttribute('src')).toMatch(/\/assets\/site\/logo\.png$/);
  expect(img).toHaveClass('brand');
  fireEvent.error(img); expect(img).toHaveAttribute('src', '/logo.png');
  delete process.env.REACT_APP_SITE_ASSETS_MODE;
});
