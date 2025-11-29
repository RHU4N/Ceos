import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaExternalLinkAlt, FaClipboard } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { fetchHistorico, deleteHistoricoItem, clearHistorico } from '../../infrastructure/api/historicoClient';
import { speak, useTTS } from '../../hooks/useTTS';

function Historico() {
  const { user } = useAuth();
  const { loading, setLoading } = useLoading();
  const { enabled } = useTTS();

  useEffect(() => {
    if (!enabled) return;
    try { speak('Histórico de operações'); } catch (e) {}
  }, [enabled]);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError('');
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchHistorico();
      if (Array.isArray(data) && data.length > 0) {
        setHistorico(data);
      } else {
        // Fallback: use localStorage copy of the logged user if backend unavailable or empty
        try {
          const stored = localStorage.getItem('ceos_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            const localHist = parsed && parsed.historico ? parsed.historico : [];
            setHistorico(Array.isArray(localHist) ? localHist : []);
          } else {
            setHistorico([]);
          }
        } catch (e) {
          setHistorico([]);
        }
      }
    } catch (err) {
      console.error(err);
      // Try to recover from fetch error by using localStorage
      try {
        const stored = localStorage.getItem('ceos_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const localHist = parsed && parsed.historico ? parsed.historico : [];
          setHistorico(Array.isArray(localHist) ? localHist : []);
        } else {
          setHistorico([]);
        }
      } catch (e) {
        setHistorico([]);
      }
      setError(err?.message || 'Erro ao carregar histórico (fallback para localStorage)');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportPos, setExportPos] = React.useState(null);
  const exportBtnRef = React.useRef(null);
  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    try {
      const str = JSON.stringify(historico, null, 2);
      downloadFile(str, 'historico.json', 'application/json;charset=utf-8;');
      speak('Histórico baixado como JSON');
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao exportar JSON');
    }
  };

  const copyAsJSON = async () => {
    try {
      const str = JSON.stringify(historico, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(str);
      } else {
        const ta = document.createElement('textarea');
        ta.value = str;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      speak('Histórico copiado para a área de transferência');
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao copiar para área de transferência');
    }
  };

  const escapeCsv = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const exportAsCSV = () => {
    try {
      // Build dynamic headers from valores keys
      const allKeys = new Set();
      const parsed = historico.map(h => {
        const vals = parseValores(h.valores || '');
        Object.keys(vals).forEach(k => allKeys.add(k));
        return { h, vals };
      });
      const valKeys = Array.from(allKeys);
      const headers = ['tipo', ...valKeys, 'resultado', 'data'];

      const rows = parsed.map(({ h, vals }) => {
        const row = [];
        row.push(escapeCsv(h.tipo));
        for (const k of valKeys) {
          row.push(escapeCsv(vals[k] !== undefined ? vals[k] : ''));
        }
        row.push(escapeCsv(typeof h.resultado === 'object' ? JSON.stringify(h.resultado) : h.resultado));
        row.push(escapeCsv(h.data || h.date || h.createdAt || ''));
        return row;
      });

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadFile(csv, 'historico.csv', 'text/csv;charset=utf-8;');
      speak('Histórico baixado como CSV');
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao exportar CSV');
    }
  };

  const parseValores = (valores) => {
    // valores stored as 'k=v, k2=v2' — parse into object
    if (!valores || typeof valores !== 'string') return {};
    return valores.split(',').map(s => s.trim()).filter(Boolean).reduce((acc, pair) => {
      const [k, ...rest] = pair.split('=');
      if (!k) return acc;
      const v = rest.join('=');
      // try to convert to number when appropriate
      const num = Number(v);
      acc[k.trim()] = (!Number.isNaN(num) && v !== '') ? num : v;
      return acc;
    }, {});
  };

  const handleOpen = (item) => {
    // determine route based on item.tipo
    const tipo = item.tipo || '';
    const parts = tipo.split(':').map(p => p.trim());
    const allParts = parts.map(p => String(p).toLowerCase());
    let route = null;
    let state = { historicoEntry: item };
    // parse valores into object
    state.initialValues = parseValores(item.valores || '');

    // mapping common prefixes to routes
    const key = parts[0] ? parts[0].toLowerCase() : '';
    // check all parts for more robust matching (e.g. 'Quimica:Solucoes:...')
    const has = (s) => allParts.includes(s.toLowerCase());

    if (key.includes('matematicafinanceira') || has('matematicafinanceira')) {
      route = '/matematica/financeira';
      // subtype in parts[1] may be operation like 'variacao' -> pass it
      if (parts[1]) state.subtype = parts[1];
    } else if ((key === 'matematica' && parts[1] && parts[1].toLowerCase() === 'funcao') || has('funcao')) {
      route = '/matematica/funcao';
      if (parts[2]) state.subtype = parts[2];
    } else if (key.includes('funcao')) {
      route = '/matematica/funcao';
      if (parts[1]) state.subtype = parts[1];
    } else if (has('analise') || has('analisecomb') || key.includes('analise') || key.includes('analisecomb')) {
      route = '/matematica/analise-combinatoria';
    } else if (key.includes('estatistica')) {
      route = '/matematica/estatistica';
    } else if (key.includes('cinetica')) {
      route = '/fisica/cinetica';
    } else if (key.includes('dinamica')) {
      route = '/fisica/dinamica';
    } else if (key.includes('energia')) {
      route = '/fisica/energia';
    } else if (key.includes('concentracao')) {
      route = '/quimica/concentracao';
    } else if (key.includes('estequiometria')) {
      route = '/quimica/estequiometria';
    } else if (key.includes('termoquimica')) {
      route = '/quimica/termoquimica';
    } else if (key.includes('solucoes') || has('solucoes')) {
      route = '/solucoes';
    }

    if (route) {
      navigate(route, { state });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este item do histórico?')) return;
    setBusy(true);
    try {
      await deleteHistoricoItem(id);
      setHistorico(prev => prev.filter(i => (i._id || i.id) !== id));
      speak('Item removido do histórico');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Erro ao remover item');
    } finally {
      setBusy(false);
    }
  };

  const [copiedId, setCopiedId] = useState(null);

  const copyCard = async (item) => {
    try {
      const text = `valores: ${item.valores || ''}\nresultado: ${typeof item.resultado === 'object' ? JSON.stringify(item.resultado) : String(item.resultado)}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopiedId(item._id || item.id || item._key || Date.now());
      speak('Conteúdo copiado');
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error(err);
      setError('Erro ao copiar');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Remover todo o histórico? Esta ação não pode ser desfeita.')) return;
    setBusy(true);
    try {
      await clearHistorico();
      setHistorico([]);
      speak('Histórico limpo');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Erro ao limpar histórico');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 text-center">
            <h3>Histórico</h3>
            <div className="alert alert-info">Você precisa estar logado para ver seu histórico.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10">
          <div className="historico-header mb-3">
            <h3>Histórico de operações</h3>
            <div className="historico-actions">
              <div style={{ position: 'relative' }}>
                <button ref={exportBtnRef} className="btn btn-outline-secondary me-2" onClick={e => {
                  try {
                    const rect = exportBtnRef.current && exportBtnRef.current.getBoundingClientRect();
                    if (rect) setExportPos({ top: rect.bottom + 8, left: rect.left });
                  } catch (err) {}
                  setExportOpen(o => !o);
                }} disabled={busy || loading || historico.length === 0}>Exportar</button>
                {exportOpen && (
                  <div className="export-menu card p-2" style={{ position: 'fixed', top: exportPos?.top || 100, left: exportPos?.left || '50%', zIndex: 1050, minWidth: 220 }}>
                    <button className="btn btn-sm btn-light w-100 mb-1" onClick={copyAsJSON}>Copiar JSON (área de transferência)</button>
                    <button className="btn btn-sm btn-light w-100 mb-1" onClick={exportAsJSON}>Baixar JSON</button>
                    <button className="btn btn-sm btn-light w-100" onClick={exportAsCSV}>Baixar CSV</button>
                  </div>
                )}
              </div>
              <button className="btn btn-outline-secondary me-2" onClick={load} disabled={loading || busy}>Atualizar</button>
              <button className="btn btn-danger" onClick={handleClearAll} disabled={busy || loading || historico.length === 0}>Limpar tudo</button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {historico.length === 0 ? (
            <div className="card p-4 text-center">
              <div className="card-body">Nenhuma operação registrada ainda.</div>
            </div>
          ) : (
            <div className="list-group">
              {historico.map(item => {
                const id = item._id || item.id || item._key || '';
                const when = item.data || item.date || item.createdAt || item.created_at || null;
                const dateText = when ? new Date(when).toLocaleString() : '';
                return (
                  <div key={id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div style={{ maxWidth: '78%' }}>
                      <div className="fw-bold">{item.tipo}</div>
                      <div className="text-muted small">{item.valores}</div>
                      <div className="mt-1">Resultado: <strong>{typeof item.resultado === 'object' ? JSON.stringify(item.resultado) : String(item.resultado)}</strong></div>
                      {dateText && <div className="text-muted small mt-1">{dateText}</div>}
                    </div>
                    <div className="historico-item-actions">
                      <button className="btn btn-sm historico-btn historico-copy" title="Copiar valores e resultado" onClick={() => copyCard(item)}>
                        <FaClipboard />
                      </button>
                      <button className="btn btn-sm historico-btn historico-open" title="Abrir (duplo clique também funciona)" onClick={() => handleOpen(item)} onDoubleClick={() => handleOpen(item)}>
                        <FaExternalLinkAlt />
                      </button>
                      <button className="btn btn-sm historico-btn historico-delete" title="Remover" onClick={() => handleDelete(id)} disabled={busy}>
                        <FaTrash />
                      </button>
                      {copiedId && copiedId === (item._id || item.id || item._key) && (
                        <span className="text-success small ms-2">Copiado!</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Historico;
