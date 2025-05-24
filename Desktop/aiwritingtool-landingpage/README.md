# AIStoryCraft

A browser-based writing tool with AI assistance powered by both Hugging Face and DeepSeek language models.

## Features

- Rich text editor for writing
- AI assistance for generating, editing, and chatting about text
- Multiple language model options:
  - DeepSeek Chat (V3) and DeepSeek Reasoner (R1) via direct DeepSeek API
  - Various Hugging Face models (Qwen3, Llama-3, Mixtral, Gemma, Falcon, GPT-2, etc.)
- Context awareness for AI generation
- Customizable tone and length

## Quick Start

1. Clone this repository
2. Double-click either:
   - `start-dev.bat` (for Command Prompt)
   - `start-dev.ps1` (for PowerShell - right-click and select "Run with PowerShell")
3. Open your browser to http://localhost:8888

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up API keys:
   - **DeepSeek API Key**: For DeepSeek models, obtain an API key from [DeepSeek Platform](https://platform.deepseek.com/api_keys)
   - **Hugging Face API Key**: For Hugging Face models, obtain an API key from [Hugging Face](https://huggingface.co/settings/tokens)
4. Configure your API keys using environment variables (described below)
5. Run the development server using one of the following methods:
   - Double-click `start-dev.bat` (Command Prompt)
   - Right-click `start-dev.ps1` and select "Run with PowerShell"
   - Run `npm run dev` in your terminal

## API Key Configuration

### For Development

Create a `.env` file in the root directory with your API keys:

```
HF_API_KEY=your_huggingface_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
NODE_ENV=development
```

### For Production (Netlify)

When deploying to Netlify, set the environment variables in the Netlify dashboard:

1. Go to your site settings in Netlify
2. Navigate to "Environment variables"
3. Add the following variables:
   - `HF_API_KEY` - Your Hugging Face API key
   - `DEEPSEEK_API_KEY` - Your DeepSeek API key

IMPORTANT: Never commit your actual API keys to the repository!

## Development

This project uses:
- Netlify Functions for serverless backend
- TailwindCSS for styling
- Vanilla JavaScript for frontend functionality

### Starting the Development Server

You have three options to start the development server:

1. **Command Prompt (Recommended for Windows):**
   - Double-click `start-dev.bat`
   - Or run it from the command line: `.\start-dev.bat`

2. **PowerShell:**
   - Right-click `start-dev.ps1` and select "Run with PowerShell"
   - Or run it from PowerShell: `.\start-dev.ps1`

3. **NPM:**
   ```bash
   npm run dev
   ```

The server will start with:
- 120-second timeout for AI functions
- Port 8888
- Hot reloading enabled

## Deployment

The easiest way to deploy this application is through Netlify:

1. Create a new site on Netlify
2. Connect to your Git repository
3. Set the build command to `npm run build`
4. Set the publish directory to `.`
5. Set environment variables for your API keys:
   - `DEEPSEEK_API_KEY`
   - `HF_API_KEY`
6. Deploy the site

## Troubleshooting

If you encounter timeouts when generating text:
1. Try using a shorter prompt
2. Reduce the length parameter in the UI
3. Use faster models like DistilGPT-2 for initial testing
4. Check that your API keys are valid and have sufficient quota

## License

MIT

## Tech Stack

- HTML5/CSS3 with Tailwind CSS
- Vanilla JavaScript
- Font Awesome for icons
- Google Fonts (Inter, Merriweather)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/themalagasywizard/aiwritingtool.git
```

2. Open `index.html` in your browser

## Project Structure

```
aiwritingtool/
├── index.html          # Main application file
├── README.md          # Project documentation
├── functions/         # Netlify serverless functions
│   ├── generate-text.js # AI text generation function
│   └── config.js      # Configuration variables
└── docs/             # Documentation files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- Tailwind CSS for styling 