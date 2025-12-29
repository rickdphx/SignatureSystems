const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://signaturebrain.com', 'https://signaturebrain.com', 'http://18.118.103.251'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'ben-admin-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Config file path
const CONFIG_DIR = path.join(__dirname, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'ben-admin.config.json');
const LOGS_FILE = path.join(CONFIG_DIR, 'system.log');

// Ensure config directory exists
async function ensureConfigDir() {
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating config directory:', err);
    }
}

// Load configuration
async function loadConfig() {
    try {
        await ensureConfigDir();
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Return default config if file doesn't exist
        return {
            aiModels: {
                grok: {
                    apiKey: '',
                    model: 'grok-beta'
                },
                claude: {
                    apiKey: '',
                    model: 'claude-3-5-sonnet-20241022'
                },
                systemInstructions: 'You are a helpful AI assistant aligned with Torah principles and business excellence.'
            },
            benIntegration: {
                serviceUrl: '',
                apiToken: '',
                webhookUrl: '',
                config: {}
            }
        };
    }
}

// Save configuration
async function saveConfig(config) {
    try {
        await ensureConfigDir();
        const tmpFile = CONFIG_FILE + '.tmp';
        await fs.writeFile(tmpFile, JSON.stringify(config, null, 2));
        await fs.rename(tmpFile, CONFIG_FILE);
        return true;
    } catch (err) {
        console.error('Error saving config:', err);
        throw err;
    }
}

// Append to log file
async function appendLog(message) {
    try {
        await ensureConfigDir();
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        await fs.appendFile(LOGS_FILE, logEntry);
    } catch (err) {
        console.error('Error writing to log:', err);
    }
}

// Read logs
async function readLogs(limit = 200) {
    try {
        const data = await fs.readFile(LOGS_FILE, 'utf8');
        const lines = data.trim().split('\n');
        return lines.slice(-limit);
    } catch (err) {
        return [];
    }
}

// API Routes

// Get configuration
app.get('/api/config', async (req, res) => {
    try {
        const config = await loadConfig();

        // Mask API keys for security
        const maskedConfig = JSON.parse(JSON.stringify(config));
        if (maskedConfig.aiModels.grok.apiKey) {
            maskedConfig.aiModels.grok.apiKey = '********';
        }
        if (maskedConfig.aiModels.claude.apiKey) {
            maskedConfig.aiModels.claude.apiKey = '********';
        }
        if (maskedConfig.benIntegration.apiToken) {
            maskedConfig.benIntegration.apiToken = '********';
        }

        res.json(maskedConfig);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

// Save configuration
app.post('/api/config', async (req, res) => {
    try {
        const newConfig = req.body;

        // Load existing config to preserve actual API keys if masked
        const existingConfig = await loadConfig();

        // Don't overwrite keys if they're masked
        if (newConfig.aiModels.grok.apiKey === '********') {
            newConfig.aiModels.grok.apiKey = existingConfig.aiModels.grok.apiKey;
        }
        if (newConfig.aiModels.claude.apiKey === '********') {
            newConfig.aiModels.claude.apiKey = existingConfig.aiModels.claude.apiKey;
        }
        if (newConfig.benIntegration.apiToken === '********') {
            newConfig.benIntegration.apiToken = existingConfig.benIntegration.apiToken;
        }

        await saveConfig(newConfig);
        await appendLog('Configuration saved successfully');

        res.json({ success: true, message: 'Configuration saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Test connection
app.post('/api/test-connection', async (req, res) => {
    try {
        const config = await loadConfig();
        const { serviceUrl } = config.benIntegration;

        if (!serviceUrl) {
            return res.json({ success: false, message: 'Service URL not configured' });
        }

        const response = await axios.get(serviceUrl, { timeout: 5000 });
        await appendLog(`Connection test to ${serviceUrl}: SUCCESS`);

        res.json({ success: true, message: 'Connection successful', status: response.status });
    } catch (err) {
        await appendLog(`Connection test failed: ${err.message}`);
        res.json({ success: false, message: err.message });
    }
});

// BEN Console - Process prompt
app.post('/api/ben/console', async (req, res) => {
    try {
        const { prompt, mode } = req.body;
        const config = await loadConfig();

        await appendLog(`BEN Console request - Mode: ${mode}, Prompt: ${prompt.substring(0, 50)}...`);

        let response;

        // Route to appropriate AI model based on mode
        if (mode === 'deep' || mode === 'research') {
            // Use Claude for deep reasoning and research
            if (!config.aiModels.claude.apiKey) {
                return res.status(400).json({ error: 'Claude API key not configured' });
            }

            response = await callClaudeAPI(prompt, mode, config);
        } else {
            // Use Grok for normal, torah, and execute modes
            if (!config.aiModels.grok.apiKey) {
                return res.status(400).json({ error: 'Grok API key not configured' });
            }

            response = await callGrokAPI(prompt, mode, config);
        }

        await appendLog(`BEN Console response generated successfully`);
        res.json({ success: true, response });

    } catch (err) {
        await appendLog(`BEN Console error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// Call Grok API
async function callGrokAPI(prompt, mode, config) {
    const systemPrompt = getSystemPrompt(mode, config);

    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
        model: config.aiModels.grok.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
    }, {
        headers: {
            'Authorization': `Bearer ${config.aiModels.grok.apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}

// Call Claude API
async function callClaudeAPI(prompt, mode, config) {
    const systemPrompt = getSystemPrompt(mode, config);

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: config.aiModels.claude.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
            { role: 'user', content: prompt }
        ]
    }, {
        headers: {
            'x-api-key': config.aiModels.claude.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        }
    });

    return response.data.content[0].text;
}

// Get system prompt based on mode
function getSystemPrompt(mode, config) {
    const baseInstructions = config.aiModels.systemInstructions;

    switch (mode) {
        case 'torah':
            return `${baseInstructions}\n\nYou are operating in Torah Mode. Provide responses that are aligned with Torah principles and Jewish wisdom. Consider ethical implications from a Torah perspective.`;

        case 'research':
            return `${baseInstructions}\n\nYou are operating in Research Mode. Provide comprehensive, well-researched responses with detailed analysis. Include multiple perspectives and cite reasoning.`;

        case 'execute':
            return `${baseInstructions}\n\nYou are operating in Haríts (Execute) Mode. Provide direct, actionable responses without extensive discussion. Focus on concrete steps and implementation.`;

        case 'deep':
            return `${baseInstructions}\n\nYou are operating in Deep Reasoning Mode. Engage in thorough analysis with step-by-step reasoning. Consider multiple angles and provide nuanced insights.`;

        default: // normal
            return baseInstructions;
    }
}

// Get system logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await readLogs(200);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Failed to read logs' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`BEN Admin Backend running on port ${PORT}`);
    appendLog(`Server started on port ${PORT}`);
});
