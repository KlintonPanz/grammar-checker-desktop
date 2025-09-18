const { ipcRenderer, clipboard } = require('electron');
const axios = require('axios');

const textInput = document.getElementById('textInput');
const paraphraseBtn = document.getElementById('paraphrase');
const toneSelect = document.getElementById('toneSelect');
const loading = document.getElementById('loading');
const status = document.getElementById('status');
const mainSection = document.querySelector('.main-section');

// Settings elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettings');
const apiKeyInput = document.getElementById('apiKeyInput');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const testApiKeyBtn = document.getElementById('testApiKey');


// Sound settings elements
const soundEnabledToggle = document.getElementById('soundEnabled');
const successSoundSelect = document.getElementById('successSoundType');
const errorSoundSelect = document.getElementById('errorSoundType');
const testSoundsBtn = document.getElementById('testSounds');

// Custom tone elements
const createCustomToneBtn = document.getElementById('createCustomTone');
const customTonesList = document.getElementById('customTonesList');
const mainSettingsTab = document.getElementById('mainSettingsTab');
const customToneTab = document.getElementById('customToneTab');
const backToSettingsBtn = document.getElementById('backToSettings');
const customToneName = document.getElementById('customToneName');
const customTonePrompt = document.getElementById('customTonePrompt');
const saveCustomToneBtn = document.getElementById('saveCustomTone');

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
    const isSettingsVisible = settingsPanel.style.display !== 'none';
    if (isSettingsVisible) {
        settingsPanel.style.display = 'none';
        mainSection.style.display = 'flex';
    } else {
        settingsPanel.style.display = 'block';
        mainSection.style.display = 'none';
    }
});

closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    mainSection.style.display = 'flex';
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

// Sound Settings Events
soundEnabledToggle.addEventListener('change', () => {
    saveSoundSettings();
});

successSoundSelect.addEventListener('change', () => {
    saveSoundSettings();
});

errorSoundSelect.addEventListener('change', () => {
    saveSoundSettings();
});

testSoundsBtn.addEventListener('click', () => {
    testSounds();
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

    // Load sound settings
    loadSoundSettings();

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

// Guaranteed loading state cleanup function
function hideLoadingState() {
    console.log('hideLoadingState() called');

    // Get elements dynamically to avoid null reference issues
    const loadingElement = document.getElementById('loading');
    const paraphraseButton = document.getElementById('paraphrase');
    const toneSelector = document.getElementById('toneSelect');
    const textInputElement = document.getElementById('textInput');

    console.log('loadingElement found:', !!loadingElement);
    console.log('loadingElement:', loadingElement);

    try {
        // Hide loading spinner
        if (loadingElement) {
            loadingElement.style.display = 'none';
            console.log('Successfully hid loading element');
        } else {
            console.error('Loading element not found! DOM might not be ready.');
        }

        // Re-enable button and remove processing state
        if (paraphraseButton) {
            paraphraseButton.disabled = false;
            paraphraseButton.classList.remove('processing');
            console.log('Re-enabled paraphrase button');
        }

        // Re-enable tone selector
        if (toneSelector) {
            toneSelector.disabled = false;
        }

        // Remove processing class from text input
        if (textInputElement) {
            textInputElement.classList.remove('processing');
        }
    } catch (error) {
        console.error('Error hiding loading state:', error);
        // Force hide loading even if cleanup fails
        const forceLoadingElement = document.getElementById('loading');
        if (forceLoadingElement) forceLoadingElement.style.display = 'none';
    }
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
        showToast('Paraphrased and copied ⚔️');

        // Auto-select the result
        textInput.focus();
        textInput.select();

    } catch (error) {
        if (error.response?.status === 401) {
            showToast('Invalid API key. Please check settings.', 'error');
            settingsPanel.style.display = 'block';
        } else {
            showToast(`Error: ${error.message}`, 'error');
        }
        console.error('Error:', error);
    } finally {
        // GUARANTEE that loading state is always hidden
        hideLoadingState();
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

    // Add processing animations
    paraphraseBtn.classList.add('processing');
    textInput.classList.add('processing');
}

function showStatus(message, type = 'success') {
    loading.style.display = 'none';
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'flex';
    paraphraseBtn.disabled = false;
    toneSelect.disabled = false;

    // Remove processing animations
    paraphraseBtn.classList.remove('processing');
    textInput.classList.remove('processing');

    // Play sound effect
    if (type === 'success') {
        playSuccessSound();
    } else if (type === 'error') {
        playErrorSound();
    }

    // Hide status after 4 seconds with fade out
    setTimeout(() => {
        status.style.opacity = '0';
        setTimeout(() => {
            status.style.display = 'none';
            status.textContent = '';
            status.style.opacity = '1';
        }, 300);
    }, 4000);
}

// Sound Effect Functions
function playSuccessSound() {
    const soundSettings = getSoundSettings();
    if (!soundSettings.enabled) return;

    playSound('success', soundSettings.successType);
}

function playErrorSound() {
    const soundSettings = getSoundSettings();
    if (!soundSettings.enabled) return;

    const errorType = soundSettings.errorType;
    if (errorType === 'none') return;

    playSound('error', errorType);
}

function playSound(category, type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        if (category === 'success') {
            switch (type) {
                case 'starwars':
                    playStarWarsSuccess(audioContext);
                    break;
                case 'chime':
                    playChimeSound(audioContext);
                    break;
                case 'beep':
                    playTechBeep(audioContext);
                    break;
                case 'ding':
                    playNotificationDing(audioContext);
                    break;
            }
        } else if (category === 'error') {
            switch (type) {
                case 'warning':
                    playWarningSound(audioContext);
                    break;
                case 'buzz':
                    playErrorBuzz(audioContext);
                    break;
                case 'alert':
                    playAlertTone(audioContext);
                    break;
            }
        }
    } catch (error) {
        console.log('Audio playback not available:', error);
    }
}

function playStarWarsSuccess(audioContext) {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator1.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator1.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);

    oscillator2.frequency.setValueAtTime(261.63, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.1);
    oscillator2.frequency.setValueAtTime(392.00, audioContext.currentTime + 0.2);

    oscillator1.type = 'sine';
    oscillator2.type = 'triangle';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.4);
    oscillator2.stop(audioContext.currentTime + 0.4);
}

function playChimeSound(audioContext) {
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.5);

        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + index * 0.1 + 0.5);
    });
}

function playTechBeep(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playNotificationDing(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.3);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playWarningSound(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(185, audioContext.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime + 0.3);

    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playErrorBuzz(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
}

function playAlertTone(audioContext) {
    [600, 400, 600, 400].forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.15);
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.15 + 0.15);

        oscillator.start(audioContext.currentTime + index * 0.15);
        oscillator.stop(audioContext.currentTime + index * 0.15 + 0.15);
    });
}

// Sound Settings Management
function getSoundSettings() {
    const defaults = {
        enabled: true,
        successType: 'starwars',
        errorType: 'warning'
    };

    try {
        const saved = localStorage.getItem('soundSettings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (error) {
        return defaults;
    }
}

function saveSoundSettings() {
    const settings = {
        enabled: soundEnabledToggle.checked,
        successType: successSoundSelect.value,
        errorType: errorSoundSelect.value
    };

    localStorage.setItem('soundSettings', JSON.stringify(settings));
}

function loadSoundSettings() {
    const settings = getSoundSettings();

    soundEnabledToggle.checked = settings.enabled;
    successSoundSelect.value = settings.successType;
    errorSoundSelect.value = settings.errorType;
}

function testSounds() {
    const settings = getSoundSettings();

    // Test success sound
    playSound('success', settings.successType);

    // Test error sound after a delay
    setTimeout(() => {
        if (settings.errorType !== 'none') {
            playSound('error', settings.errorType);
        }
    }, 1000);
}

// Simple Toast Notification System
function showToast(message, type = 'success') {
    // Ensure we never leave the spinner visible if toast triggers outside the normal flow
    hideLoadingState();

    // Note: Loading state cleanup is handled by hideLoadingState() in processText finally block

    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    // Add to body
    document.body.appendChild(toast);

    // Play sound
    if (type === 'success') {
        playSuccessSound();
    } else if (type === 'error') {
        playErrorSound();
    }

    // Show with animation
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);

    // Hide and remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}
