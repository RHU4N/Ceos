import React, { useState } from 'react';
import { loginApiUrl } from '../../config/apiConfig';

// Opt-in until the private-container gateway is deployed. Retain the current
// illustrations as an availability fallback without changing their layout.
export default function SiteImage({ src, alt, ...props }) {
  const [failed, setFailed] = useState(false);
  const azure = process.env.REACT_APP_SITE_ASSETS_MODE === 'azure';
  const name = src.replace(/^\//, '');
  const remote = `${loginApiUrl}/assets/site/${encodeURIComponent(name)}`;
  return <img {...props} alt={alt} src={azure && !failed ? remote : src}
    onError={azure && !failed ? () => setFailed(true) : undefined} />;
}
