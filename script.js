// ============================================
// UNIASSIST - MAIN JAVASCRIPT FILE
// ============================================

// ============================================
// GLOBAL SETTINGS APPLICATION
// ============================================
function applyGlobalSettings() {
    // Apply dark mode
    const savedDarkMode = localStorage.getItem('uniassist_dark_mode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Apply font size
    const savedFontSize = localStorage.getItem('uniassist_font_size');
    if (savedFontSize) {
        document.documentElement.style.setProperty('--font-size', savedFontSize + 'px');
    }

    // Apply accent color
    const savedAccentColor = localStorage.getItem('uniassist_accent_color');
    if (savedAccentColor) {
        document.documentElement.style.setProperty('--primary-color', savedAccentColor);
    }
}

// Apply settings immediately
applyGlobalSettings();

// ============================================
// TEXT TO SPEECH FUNCTION
// ============================================
function speakText(text) {
    if (window.speechSynthesis) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1; // Normal speed
        utterance.pitch = 1; // Normal pitch
        utterance.volume = 1; // Full volume
        
        // Try to use a good voice
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Prefer a female voice if available
            const femaleVoice = voices.find(voice => voice.name.includes('Google UK') || voice.name.includes('Samantha'));
            utterance.voice = femaleVoice || voices[0];
        }
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Text-to-Speech not supported in this browser. Please use Chrome or Edge.");
    }
}

// ============================================
// SPEECH TO TEXT FUNCTION
// ============================================
function startDictation() {
    if (window.hasOwnProperty('webkitSpeechRecognition')) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.start();
        
        recognition.onresult = function(e) {
            const transcript = e.results[0][0].transcript;
            const textarea = document.getElementById('dictation-box');
            if (textarea) {
                textarea.value = transcript;
                speakText(`You said: ${transcript}`);
            }
        };
        
        recognition.onerror = function(e) {
            console.error('Speech recognition error:', e.error);
            alert("Speech recognition error: " + e.error);
        };
        
        recognition.onend = function() {
            console.log('Speech recognition ended');
        };
    } else {
        alert("Browser not supported for Speech Recognition. Please use Chrome or Edge.");
    }
}

// ============================================
// COLOR NAME DETECTION (Enhanced)
// ============================================
const colorDatabase = [
    { name: "Red", r: 255, g: 0, b: 0 },
    { name: "Blue", r: 0, g: 0, b: 255 },
    { name: "Green", r: 0, g: 128, b: 0 },
    { name: "Yellow", r: 255, g: 255, b: 0 },
    { name: "Black", r: 0, g: 0, b: 0 },
    { name: "White", r: 255, g: 255, b: 255 },
    { name: "Orange", r: 255, g: 165, b: 0 },
    { name: "Purple", r: 128, g: 0, b: 128 },
    { name: "Pink", r: 255, g: 192, b: 203 },
    { name: "Brown", r: 165, g: 42, b: 42 },
    { name: "Cyan", r: 0, g: 255, b: 255 },
    { name: "Magenta", r: 255, g: 0, b: 255 },
    { name: "Gray", r: 128, g: 128, b: 128 },
    { name: "Lime", r: 0, g: 255, b: 0 },
    { name: "Navy", r: 0, g: 0, b: 128 },
    { name: "Teal", r: 0, g: 128, b: 128 },
    { name: "Maroon", r: 128, g: 0, b: 0 },
    { name: "Olive", r: 128, g: 128, b: 0 },
    { name: "Aqua", r: 0, g: 255, b: 255 },
    { name: "Silver", r: 192, g: 192, b: 192 },
    { name: "Gold", r: 255, g: 215, b: 0 },
    { name: "Coral", r: 255, g: 127, b: 80 },
    { name: "Indigo", r: 75, g: 0, b: 130 },
    { name: "Violet", r: 238, g: 130, b: 238 },
    { name: "Turquoise", r: 64, g: 224, b: 208 },
    { name: "Beige", r: 245, g: 245, b: 220 },
    { name: "Lavender", r: 230, g: 230, b: 250 },
    { name: "Mint", r: 189, g: 252, b: 201 },
    { name: "Peach", r: 255, g: 218, b: 185 }
];

function getColorName(r, g, b) {
    let closest = colorDatabase[0];
    let minDiff = 999999;
    
    colorDatabase.forEach(c => {
        const diff = Math.abs(r - c.r) + Math.abs(g - c.g) + Math.abs(b - c.b);
        if (diff < minDiff) {
            minDiff = diff;
            closest = c;
        }
    });
    
    return closest.name;
}

// ============================================
// SETTINGS MODAL LOGIC
// ============================================
function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const btn = document.getElementById('theme-toggle');
    const span = document.getElementsByClassName('close-btn')[0];

    if (btn && modal) {
        btn.onclick = () => {
            modal.style.display = "block";
        };
    }
    
    if (span && modal) {
        span.onclick = () => {
            modal.style.display = "none";
        };
    }
    
    if (modal) {
        window.onclick = (e) => {
            if (e.target == modal) modal.style.display = "none";
        };
    }

    // Dark Mode
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            document.body.classList.toggle('dark-mode', e.target.checked);
            localStorage.setItem('uniassist_dark_mode', e.target.checked);
        });
    }

    // Font Size
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeDisplay = document.getElementById('font-size-display');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            document.documentElement.style.setProperty('--font-size', size + 'px');
            if (fontSizeDisplay) {
                fontSizeDisplay.textContent = size + 'px';
            }
            localStorage.setItem('uniassist_font_size', size);
        });
    }

    // Accent Color
    const accentColorPicker = document.getElementById('accent-color-picker');
    if (accentColorPicker) {
        accentColorPicker.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--primary-color', e.target.value);
            localStorage.setItem('uniassist_accent_color', e.target.value);
        });
    }

    // Set Accent Color from Palette
    window.setAccentColor = function(color) {
        if (accentColorPicker) {
            accentColorPicker.value = color;
        }
        document.documentElement.style.setProperty('--primary-color', color);
        localStorage.setItem('uniassist_accent_color', color);
    };

    // Reset Settings
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.body.classList.remove('dark-mode');
            if (darkModeToggle) darkModeToggle.checked = false;
            localStorage.setItem('uniassist_dark_mode', 'false');
            
            if (fontSizeSlider) {
                fontSizeSlider.value = 16;
            }
            document.documentElement.style.setProperty('--font-size', '16px');
            if (fontSizeDisplay) {
                fontSizeDisplay.textContent = '16px';
            }
            localStorage.setItem('uniassist_font_size', '16');
            
            if (accentColorPicker) {
                accentColorPicker.value = '#0056b3';
            }
            document.documentElement.style.setProperty('--primary-color', '#0056b3');
            localStorage.setItem('uniassist_accent_color', '#0056b3');
            
            alert('Settings reset to default!');
        });
    }

    // Load Saved Settings
    const savedDarkMode = localStorage.getItem('uniassist_dark_mode');
    if (savedDarkMode === 'true' && darkModeToggle) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    const savedFontSize = localStorage.getItem('uniassist_font_size');
    if (savedFontSize && fontSizeSlider) {
        fontSizeSlider.value = savedFontSize;
        document.documentElement.style.setProperty('--font-size', savedFontSize + 'px');
        if (fontSizeDisplay) {
            fontSizeDisplay.textContent = savedFontSize + 'px';
        }
    }
    
    const savedAccentColor = localStorage.getItem('uniassist_accent_color');
    if (savedAccentColor && accentColorPicker) {
        accentColorPicker.value = savedAccentColor;
        document.documentElement.style.setProperty('--primary-color', savedAccentColor);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function clearText(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = '';
    }
}

function increaseFontSize(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const currentSize = parseInt(window.getComputedStyle(element).fontSize) || 16;
        element.style.fontSize = (currentSize + 2) + 'px';
    }
}

function decreaseFontSize(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const currentSize = parseInt(window.getComputedStyle(element).fontSize) || 16;
        if (currentSize > 10) {
            element.style.fontSize = (currentSize - 2) + 'px';
        }
    }
}

function resetFontSize(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.fontSize = '16px';
        element.style.fontFamily = 'Arial, sans-serif';
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('UniAssist loaded successfully');
    
    // Initialize settings modal
    initSettingsModal();
});