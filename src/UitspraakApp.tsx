import React, { useRef, useState } from 'react';

const UitspraakApp = () => {
  const [woorden, setWoorden] = useState(['', '', '', '', '']);
  const [reeks, setReeks] = useState([]);
  const [huidigWoordIndex, setHuidigWoordIndex] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [herkenningActief, setHerkenningActief] = useState(false);
  const recognitionRef = useRef(null);

  const startOefening = () => {
    const geldigeWoorden = woorden.filter((w) => w.trim() !== '');
    if (geldigeWoorden.length === 0) {
      setFeedback('Vul eerst woorden in.');
      return;
    }
    const indices = geldigeWoorden.map((_, i) => woorden.indexOf(geldigeWoorden[i]));
    setReeks(shuffle(indices));
    setFeedback('');
    setTimeout(() => kiesNieuwWoord(indices), 0);
  };

  const shuffle = (array) => {
    return array
      .map((a) => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);
  };

  const kiesNieuwWoord = (nieuweReeks = reeks) => {
    if (nieuweReeks.length === 0) {
      const geldigeIndices = woorden.map((w, i) => w.trim() !== '' ? i : null).filter(i => i !== null);
      const reshuffled = shuffle(geldigeIndices);
      setReeks(reshuffled);
      setHuidigWoordIndex(reshuffled[0]);
      setReeks(reshuffled.slice(1));
    } else {
      setHuidigWoordIndex(nieuweReeks[0]);
      setReeks(nieuweReeks.slice(1));
    }
  };

  const beoordeelUitspraak = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      setFeedback('Spraakherkenning niet ondersteund in deze browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setHerkenningActief(true);
    setFeedback('🎤 Spreek het woord uit...');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const doel = woorden[huidigWoordIndex].toLowerCase().trim();
      const score = transcript === doel ? 10 :
                    transcript.includes(doel) || doel.includes(transcript) ? 6 + Math.floor(Math.random() * 3) :
                    Math.floor(Math.random() * 5) + 1;

      const voldoende = score >= 6;
      setFeedback(`🎯 Herkend: "${transcript}" — ${voldoende ? `✅ Goed gedaan (${score}/10)` : `❌ Onvoldoende (${score}/10). Probeer opnieuw.`}`);
      setHerkenningActief(false);

      recognition.stop();

      if (voldoende) {
        setTimeout(() => {
          kiesNieuwWoord();
        }, 1500);
      }
    };

    recognition.onerror = (event) => {
      console.error('Spraakherkenning fout:', event);
      setFeedback('❗ Er ging iets mis met spraakherkenning.');
      setHerkenningActief(false);
      recognition.stop();
    };

    recognition.onend = () => {
      setHerkenningActief(false);
    };

    recognition.start();
  };

  const handleInputChange = (index, value) => {
    const nieuw = [...woorden];
    nieuw[index] = value;
    setWoorden(nieuw);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Voer 5 Nederlandse woorden in</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {woorden.map((w, i) => (
          <input
            key={i}
            value={w}
            onChange={(e) => handleInputChange(i, e.target.value)}
            placeholder={`Woord ${i + 1}`}
            style={{ padding: '0.5rem', fontSize: '1rem' }}
          />
        ))}
      </div>
      <button onClick={startOefening} style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}>
        Start oefening
      </button>

      {huidigWoordIndex !== null && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Spreek uit: <strong>{woorden[huidigWoordIndex]}</strong></h3>
          <button
            onClick={beoordeelUitspraak}
            disabled={herkenningActief}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            {herkenningActief ? '🎤 Luistert...' : '🎙️ Start opname'}
          </button>
          {feedback && <p style={{ marginTop: '1rem' }}>{feedback}</p>}
        </div>
      )}
    </div>
  );
};

export default UitspraakApp;
