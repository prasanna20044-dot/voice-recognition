import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState('en-US');

  // Text-to-Speech State
  const [textToSpeak, setTextToSpeak] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');

  // Error State
  const [error, setError] = useState('');

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = speechLanguage;

      recognitionRef.current.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPart + ' ';
          } else {
            interim += transcriptPart;
          }
        }

        setInterimTranscript(interim);
        if (final) {
          setTranscript(prev => prev + final);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };
    } else {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speechLanguage]);

  // Load available voices for Text-to-Speech
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synthRef.current.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  // Speech-to-Text Functions
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError('');
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setError('Failed to start speech recognition. Please try again.');
        console.error(err);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  // Text-to-Speech Functions
  const speakText = () => {
    if (!textToSpeak.trim()) {
      setError('Please enter some text to speak.');
      return;
    }

    setError('');
    synthRef.current.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  };

  const clearText = () => {
    setTextToSpeak('');
  };

  // Language options for speech recognition
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'hi-IN', name: 'Hindi' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">VoiceFlow</h1>
        <p className="app-subtitle">
          Transform your voice into text and text into speech with cutting-edge AI technology
        </p>
      </header>

      <main className="features-grid">
        {/* Speech-to-Text Card */}
        <div className="feature-card card">
          <div className="card-header">
            <div className="card-icon">🎤</div>
            <h2 className="card-title">Speech to Text</h2>
          </div>

          <div className="controls">
            <div className="control-group">
              <label className="control-label" htmlFor="speech-language">
                Language
              </label>
              <select
                id="speech-language"
                value={speechLanguage}
                onChange={(e) => setSpeechLanguage(e.target.value)}
                disabled={isListening}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mic-button-wrapper">
            <button
              className={`btn btn-primary btn-icon mic-button ${isListening ? 'recording' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop Recording' : 'Start Recording'}
            >
              <span className="mic-icon">{isListening ? '⏹️' : '🎤'}</span>
            </button>
          </div>

          <div className="output-display">
            {transcript || interimTranscript ? (
              <p className="output-text">
                {transcript}
                {interimTranscript && (
                  <span style={{ opacity: 0.6 }}>{interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="output-placeholder">
                Click the microphone to start recording...
              </p>
            )}
          </div>

          {isListening && (
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>Listening...</span>
            </div>
          )}

          {transcript && (
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={clearTranscript}>
                Clear
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigator.clipboard.writeText(transcript)}
              >
                📋 Copy
              </button>
            </div>
          )}
        </div>

        {/* Text-to-Speech Card */}
        <div className="feature-card card">
          <div className="card-header">
            <div className="card-icon">🔊</div>
            <h2 className="card-title">Text to Speech</h2>
          </div>

          <div className="controls">
            <div className="control-group">
              <label className="control-label" htmlFor="voice-select">
                Voice
              </label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={isSpeaking}
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label className="control-label" htmlFor="text-input">
                Text to Speak
              </label>
              <textarea
                id="text-input"
                value={textToSpeak}
                onChange={(e) => setTextToSpeak(e.target.value)}
                placeholder="Enter text here to convert to speech..."
                disabled={isSpeaking}
              />
            </div>
          </div>

          <div className="action-buttons">
            {!isSpeaking ? (
              <>
                <button
                  className="btn speaker-button"
                  onClick={speakText}
                  disabled={!textToSpeak.trim()}
                >
                  <span className="speaker-icon">🔊</span>
                  Speak
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={clearText}
                  disabled={!textToSpeak}
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                className="btn speaker-button speaking"
                onClick={stopSpeaking}
              >
                <span className="speaker-icon">⏹️</span>
                Stop
              </button>
            )}
          </div>

          {isSpeaking && (
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>Speaking...</span>
            </div>
          )}
        </div>
      </main>

      {error && (
        <div className="error-message animate-slide-up">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="info-box animate-fade-in">
        💡 <strong>Tip:</strong> For best results, use Chrome or Edge browser.
        Speech recognition requires microphone permissions.
      </div>

      <footer className="app-footer">
        <p>Powered by Web Speech API | Built with React</p>
      </footer>
    </div>
  );
}

export default App;
