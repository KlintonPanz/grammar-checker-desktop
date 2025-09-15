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

// Custom tone elements
const createCustomToneBtn = document.getElementById('createCustomTone');
const customTonesList = document.getElementById('customTonesList');
const mainSettingsTab = document.getElementById('mainSettingsTab');
const customToneTab = document.getElementById('customToneTab');
const backToSettingsBtn = document.getElementById('backToSettings');
const customToneName = document.getElementById('customToneName');
const customTonePrompt = document.getElementById('customTonePrompt');
const saveCustomToneBtn = document.getElementById('saveCustomTone');
const testCustomToneBtn = document.getElementById('testCustomTone');

// API Configuration
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Tone descriptions for AI prompts
const defaultTones = {
    professional: 'professional and business-appropriate',
    casual: 'casual and conversational',
    friendly: 'friendly and warm',
    formal: 'formal and academic',
    creative: 'creative and engaging',
    concise: 'concise and to-the-point'
};

// Custom tones storage
let customTones = JSON.parse(localStorage.getItem('customTones')) || {};

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

// Custom Tone Events
createCustomToneBtn.addEventListener('click', () => {
    showCustomToneTab();
});

backToSettingsBtn.addEventListener('click', () => {
    showMainSettingsTab();
});

saveCustomToneBtn.addEventListener('click', () => {
    saveCustomTone();
});

testCustomToneBtn.addEventListener('click', () => {
    testCustomTone();
});

// Tab Management Functions
function showCustomToneTab() {
    mainSettingsTab.style.display = 'none';
    customToneTab.style.display = 'block';
    customToneName.focus();
}

function showMainSettingsTab() {
    customToneTab.style.display = 'none';
    mainSettingsTab.style.display = 'block';
    // Clear form
    customToneName.value = '';
    customTonePrompt.value = '';
}

// Custom Tone Management Functions
function saveCustomTone() {
    const name = customToneName.value.trim();
    const prompt = customTonePrompt.value.trim();

    if (!name || !prompt) {
        showStatus('Please fill in both tone name and prompt', 'error');
        return;
    }

    // Create unique key for the tone
    const toneKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check if tone already exists
    if (customTones[toneKey]) {
        if (!confirm(`A tone named "${name}" already exists. Do you want to overwrite it?`)) {
            return;
        }
    }

    // Save the custom tone
    customTones[toneKey] = {
        name: name,
        prompt: prompt,
        created: new Date().toISOString()
    };

    localStorage.setItem('customTones', JSON.stringify(customTones));

    showStatus(`Custom tone "${name}" saved successfully! ✓`, 'success');

    // Update the UI
    updateToneDropdown();
    displayCustomTones();

    // Go back to main settings
    setTimeout(() => {
        showMainSettingsTab();
    }, 1000);
}

async function testCustomTone() {
    const name = customToneName.value.trim();
    const prompt = customTonePrompt.value.trim();

    if (!name || !prompt) {
        showStatus('Please fill in both tone name and prompt first', 'error');
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        showStatus('Please set your OpenAI API key first', 'error');
        return;
    }

    const testText = "This is a test message to see how your custom tone works.";
    const fullPrompt = `${prompt}\n\nPlease rewrite the following text using this tone and style:\n\n${testText}`;

    testCustomToneBtn.disabled = true;
    testCustomToneBtn.innerHTML = '<span class="btn-icon">⏳</span>Testing...';

    try {
        const result = await callOpenAI(fullPrompt, apiKey);

        // Show the result in a simple alert for now
        alert(`Test Result for "${name}":\n\n${result}`);
        showStatus('Custom tone test completed! ✓', 'success');
    } catch (error) {
        showStatus(`Test failed: ${error.message}`, 'error');
    } finally {
        testCustomToneBtn.disabled = false;
        testCustomToneBtn.innerHTML = '<span class="btn-icon">🧪</span>Test Tone';
    }
}

function displayCustomTones() {
    customTonesList.innerHTML = '';

    const toneKeys = Object.keys(customTones);
    if (toneKeys.length === 0) {
        customTonesList.innerHTML = '<p style="color: #6b7280; font-size: 14px; text-align: center; padding: 16px;">No custom tones created yet</p>';
        return;
    }

    toneKeys.forEach(key => {
        const tone = customTones[key];
        const toneItem = document.createElement('div');
        toneItem.className = 'custom-tone-item';

        toneItem.innerHTML = `
            <div class="custom-tone-name">${tone.name}</div>
            <div class="custom-tone-actions">
                <button class="btn mini secondary" onclick="editCustomTone('${key}')">Edit</button>
                <button class="btn mini danger" onclick="deleteCustomTone('${key}')">Delete</button>
            </div>
        `;

        customTonesList.appendChild(toneItem);
    });
}

function editCustomTone(toneKey) {
    const tone = customTones[toneKey];
    customToneName.value = tone.name;
    customTonePrompt.value = tone.prompt;
    showCustomToneTab();
}

function deleteCustomTone(toneKey) {
    const tone = customTones[toneKey];
    if (confirm(`Are you sure you want to delete the "${tone.name}" tone?`)) {
        delete customTones[toneKey];
        localStorage.setItem('customTones', JSON.stringify(customTones));
        displayCustomTones();
        updateToneDropdown();
        showStatus(`Tone "${tone.name}" deleted`, 'success');
    }
}

function updateToneDropdown() {
    // Clear existing options
    toneSelect.innerHTML = '';

    // Add default tones
    Object.keys(defaultTones).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        toneSelect.appendChild(option);
    });

    // Add custom tones if any exist
    const customToneKeys = Object.keys(customTones);
    if (customToneKeys.length > 0) {
        // Add separator
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '--- Custom Tones ---';
        toneSelect.appendChild(separator);

        // Add custom tones
        customToneKeys.forEach(key => {
            const tone = customTones[key];
            const option = document.createElement('option');
            option.value = `custom_${key}`;
            option.textContent = tone.name;
            toneSelect.appendChild(option);
        });
    }

    // Restore selected tone
    const savedTone = localStorage.getItem('selectedTone');
    if (savedTone && document.querySelector(`option[value="${savedTone}"]`)) {
        toneSelect.value = savedTone;
    }
}

// Load saved API key on startup
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // Initialize custom tones
    displayCustomTones();
    updateToneDropdown();
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
    let prompt;

    // Check if it's a custom tone
    if (selectedTone.startsWith('custom_')) {
        const toneKey = selectedTone.replace('custom_', '');
        const customTone = customTones[toneKey];

        if (customTone) {
            prompt = `${customTone.prompt}\n\nPlease rewrite the following text using this tone and style:\n\n${text}`;
        } else {
            showStatus('Custom tone not found. Please select a different tone.', 'error');
            return;
        }
    } else {
        // Use default tone
        const toneDescription = defaultTones[selectedTone];
        prompt = `Please paraphrase the following text to make it sound ${toneDescription} and clear. Only return the paraphrased version:\n\n${text}`;
    }

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