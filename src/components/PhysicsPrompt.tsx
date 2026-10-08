import { useState } from 'react';
import { Icon } from './Icons';
export default function PhysicsPrompt({
  prompt,
  lab = false,
}: {
  prompt: string;
  lab?: boolean;
}) {
  const [message, setMessage] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage('Copied. Open ChatGPT and paste the prompt.');
    } catch {
      setMessage(
        'Select and copy the prompt below, then paste it into ChatGPT.',
      );
    }
  }
  return (
    <details className="physics-prompt">
      <summary>
        <Icon name="help" size={16} />
        {lab ? 'Help me with this lab' : 'Help with the missing source'}
      </summary>
      <p>
        {lab
          ? 'The prompt first asks for your data and teacher instructions, then helps one section at a time.'
          : 'Provide a picture of the original figure or table so the tutor can use the actual values.'}
      </p>
      <div className="prompt-actions">
        <button className="secondary" onClick={() => void copy()}>
          Copy ChatGPT prompt
        </button>
        <a
          className="quiet"
          href="https://chatgpt.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open ChatGPT <Icon name="external" size={14} />
        </a>
      </div>
      <p role="status">{message}</p>
      <textarea
        readOnly
        value={prompt}
        rows={8}
        aria-label={lab ? 'Lab help prompt' : 'Missing source help prompt'}
      />
    </details>
  );
}
