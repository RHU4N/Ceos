import React from 'react';

function ExplanationCard({ title = 'Como a conta é feita', formula, exampleText, examplePairs, onCopyExample }) {
  return (
    <div className="card mt-3 explanation-card">
      <div className="card-body">
        <h6 className="card-title">{title}</h6>
        {formula && (<p><strong>Fórmula:</strong> {formula}</p>)}
        {exampleText && (<p><strong>Exemplo:</strong> {exampleText}</p>)}
        {examplePairs && examplePairs.length > 0 && (
          <p className="small text-muted">{examplePairs.join(', ')}</p>
        )}
        <div className="d-flex gap-2">
          {onCopyExample && <button type="button" className="btn btn-outline-secondary" onClick={onCopyExample}>Copiar exemplo</button>}
        </div>
      </div>
    </div>
  );
}

export default ExplanationCard;
