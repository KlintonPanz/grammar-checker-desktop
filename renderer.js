const { ipcRenderer, clipboard } = require('electron');
const axios = require('axios');

const textInput = document.getElementById('textInput');
const paraphraseBtn = document.getElementById('paraphrase');
const toneSelect = document.getElementById('toneSelect');
const loading = document.getElementById('loading');
const status = document.getElementById('status');

// Settings elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettings');
const apiKeyInput = document.getElementById('apiKeyInput');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const testApiKeyBtn = document.getElementById('testApiKey');

// API Configuration
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Tone descriptions for AI prompts
const tones = {
    professional: 'professional and business-appropriate',
    casual: 'casual and conversational',
    friendly: 'friendly and warm',
    formal: 'formal and academic',
    creative: 'creative and engaging',
    concise: 'concise and to-the-point'
};

// Settings Panel Events
settingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});

closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
});

// API Key Toggle Visibility
toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleApiKeyBtn.querySelector('.eye-icon').textContent = '🙈';
    } else {
        apiKeyInput.type = 'password';
        toggleApiKeyBtn.querySelector('.eye-icon').textContent = '👁️';
    }
});

// Save API Key
saveApiKeyBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }

    if (!apiKey.startsWith('sk-')) {
        showStatus('Invalid API key format', 'error');
        return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    showStatus('API key saved successfully! ✓', 'success');

    // Close settings panel
    setTimeout(() => {
        settingsPanel.style.display = 'none';
    }, 1500);
});

// Test API Key
testApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim() || getApiKey();
    if (!apiKey) {
        showStatus('Please enter an API key first', 'error');
        return;
    }

    showStatus('Testing API key...', 'success');
    testApiKeyBtn.disabled = true;

    try {
        await testApiConnection(apiKey);
        showStatus('API key is valid! ✓', 'success');
    } catch (error) {
        showStatus(`API key test failed: ${error.message}`, 'error');
    } finally {
        testApiKeyBtn.disabled = false;
    }
});

// Get API Key (fallback to hardcoded if not set)
function getApiKey() {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        return savedKey;
    }

    // No API key found - user needs to set one
    return null;
}

// Load saved API key on startup
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
});

// Test API Connection
async function testApiConnection(apiKey) {
    const response = await axios.post(API_URL, {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "API test successful"' }],
        max_tokens: 10
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

// Listen for text from clipboard
ipcRenderer.on('process-text', (event, data) => {
    textInput.value = data.text;
    paraphrase();
});

// Button event listener
paraphraseBtn.addEventListener('click', paraphrase);

// Enter key listener for paraphrasing
textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent new line
        paraphrase();
    }
});

// Auto-select text when clicking in textarea
textInput.addEventListener('focus', () => {
    textInput.select();
});

// Save tone preference
toneSelect.addEventListener('change', () => {
    localStorage.setItem('selectedTone', toneSelect.value);
});

// Load saved tone preference
const savedTone = localStorage.getItem('selectedTone');
if (savedTone) {
    toneSelect.value = savedTone;
}

async function paraphrase() {
    const text = textInput.value.trim();
    if (!text) return;

    const apiKey = getApiKey();
    if (!apiKey) {
        showStatus('Please set your OpenAI API key in Settings', 'error');
        settingsPanel.style.display = 'block';
        return;
    }

    const selectedTone = toneSelect.value;
    const toneDescription = tones[selectedTone];

    const prompt = `Please paraphrase the following text to make it sound ${toneDescription} and clear. Only return the paraphrased version:\n\n${text}`;

    await processText('paraphrase', prompt, apiKey);
}

async function processText(type, prompt, apiKey) {
    showLoading();

    try {
        const result = await callOpenAI(prompt, apiKey);

        // Replace text in input field
        textInput.value = result;

        // Auto-copy to clipboard
        clipboard.writeText(result);

        // Show success status with tone
        const selectedTone = toneSelect.value;
        showStatus(`Paraphrased (${selectedTone}) & copied! ✓`, 'success');

        // Auto-select the result
        textInput.focus();
        textInput.select();

    } catch (error) {
        if (error.response?.status === 401) {
            showStatus('Invalid API key. Please check your settings.', 'error');
            settingsPanel.style.display = 'block';
        } else {
            showStatus(`Error: ${error.message}`, 'error');
        }
        console.error('Error:', error);
    }
}

async function callOpenAI(prompt, apiKey) {
    const response = await axios.post(API_URL, {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content.trim();
}

function showLoading() {
    loading.style.display = 'block';
    status.textContent = '';
    paraphraseBtn.disabled = true;
    toneSelect.disabled = true;
}

function showStatus(message, type = 'success') {
    loading.style.display = 'none';
    status.textContent = message;
    status.className = `status ${type}`;
    paraphraseBtn.disabled = false;
    toneSelect.disabled = false;

    // Clear status after 3 seconds
    setTimeout(() => {
        status.textContent = '';
    }, 3000);
}