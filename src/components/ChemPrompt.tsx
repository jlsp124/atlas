import { useState } from 'react';
import { Icon } from './Icons';
export default function ChemPrompt({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState('');
  return (
    <details className="chem-prompt">
      <summary>
        Explain this with ChatGPT <Icon name="external" size={14} />
      </summary>
      <p>
        The prompt includes the exact task and course conventions. Paste it into
        ChatGPT.
      </p>
      <div className="prompt-actions">
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              setStatus('Copied.');
            } catch {
              setStatus('Copy the text below.');
            }
          }}
        >
          Copy prompt
        </button>
        <a href="https://chatgpt.com/" target="_blank" rel="noreferrer">
          Open ChatGPT
        </a>
      </div>
      <p role="status">{status}</p>
      <textarea
        readOnly
        value={prompt}
        aria-label="Chemistry explanation prompt"
        rows={6}
      />
    </details>
  );
}
