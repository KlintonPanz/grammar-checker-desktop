# Grammar Checker Desktop App

A lightweight, modern desktop application for grammar checking and paraphrasing text using OpenAI's GPT models.

![Grammar Checker Screenshot](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![Electron](https://img.shields.io/badge/Built%20with-Electron-blue)
![OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI-green)

## ✨ Features

- **⚡ Lightning Fast**: Paste → Press Enter → Get results instantly
- **🎯 6 Tone Options**: Professional, Casual, Friendly, Formal, Creative, Concise
- **🔐 Secure API Key Management**: Built-in settings with show/hide functionality
- **📋 Auto-Copy**: Results automatically copied to clipboard
- **🪟 Resizable Interface**: Adapts to your workflow needs
- **⌨️ Keyboard Shortcuts**:
  - `Enter`: Paraphrase text
  - `Shift+Enter`: New line
  - `⌘⇧G`: Grammar check (global)
  - `⌘⇧P`: Paraphrase (global)

## 🚀 Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KlintonPanz/grammar-checker-app.git
   cd grammar-checker-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your OpenAI API key**
   - Run the app: `npm start`
   - Click the ⚙️ settings button
   - Paste your API key and click "Save"

4. **Start using!**
   - Paste any text
   - Select your preferred tone
   - Press Enter or click "Paraphrase"

## 🏗️ Building for Distribution

### For macOS:
```bash
npm run build
```

### For all platforms:
```bash
npm run build -- --mac --win --linux
```

The built applications will be in the `dist/` folder.

## 💡 Usage Tips

### Workflow Examples:

**Email Writing:**
1. Draft your email in any app
2. Copy the text
3. Open Grammar Checker
4. Set tone to "Professional"
5. Press Enter
6. Paste the improved text back

**Social Media:**
1. Write your post
2. Set tone to "Casual" or "Friendly"
3. Get engaging, natural language

**Academic Writing:**
1. Copy your paragraph
2. Set tone to "Formal"
3. Get polished, academic language

### Tone Guide:
- **Professional**: Business emails, reports, proposals
- **Casual**: Social media, friendly messages
- **Friendly**: Personal correspondence, customer service
- **Formal**: Academic papers, official documents
- **Creative**: Marketing copy, storytelling
- **Concise**: Summaries, bullet points, headlines

## 🛠️ Development

### Project Structure
```
grammar-checker-app/
├── main.js           # Electron main process
├── renderer.js       # Frontend logic & API integration
├── index.html        # User interface
├── styles.css        # Modern, clean styling
├── package.json      # Dependencies & build scripts
└── assets/
    └── icon.png      # App icon
```

### Scripts
- `npm start`: Run in development mode
- `npm run dev`: Run with auto-reload
- `npm run build`: Build for distribution
- `npm run dist`: Create installer packages

### Tech Stack
- **Electron**: Cross-platform desktop framework
- **Node.js**: Runtime environment
- **OpenAI API**: GPT-3.5-turbo for text processing
- **Vanilla JS**: No heavy frameworks, stays lightweight

## 🔧 Configuration

### API Settings
- **Model**: Uses `gpt-3.5-turbo` by default
- **Cost**: ~$0.002 per request (~$3/month for 50 daily uses)
- **Max Tokens**: 500 tokens per response
- **Temperature**: 0.3 (balanced creativity/consistency)

### Customization
You can modify the tone descriptions in `renderer.js`:
```javascript
const tones = {
    professional: 'professional and business-appropriate',
    casual: 'casual and conversational',
    // Add your own custom tones here
};
```

## 🔒 Privacy & Security

- **API keys stored locally** in browser's localStorage
- **No data logging** - your text is only sent to OpenAI
- **No telemetry** or usage tracking
- **Open source** - audit the code yourself

## 📝 Cost Estimation

For typical usage (50 paraphrases per day):
- **GPT-3.5-turbo**: ~$3/month
- **GPT-4**: ~$45/month (if you upgrade the model)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- Powered by [OpenAI](https://openai.com)
- Icon design inspired by modern macOS apps

## 📧 Support

Having issues? Check these common solutions:

**App won't start**: Make sure Node.js is installed and run `npm install`

**API errors**: Verify your OpenAI API key in Settings

**Permission issues on macOS**: Grant accessibility permissions in System Preferences

---

⭐ If you find this useful, please star the repository!

*Built with ❤️ using Claude Code*