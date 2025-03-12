# 🎙️ Whisper Transcriber

> Convert speech to text with ease using OpenAI's Whisper model in a user-friendly Gradio interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.7+](https://img.shields.io/badge/python-3.7+-blue.svg)](https://www.python.org/downloads/)
[![OpenAI Whisper](https://img.shields.io/badge/AI-Whisper-brightgreen.svg)](https://github.com/openai/whisper)
[![Gradio](https://img.shields.io/badge/UI-Gradio-orange.svg)](https://gradio.app/)

![Whisper Transcriber Demo](https://raw.githubusercontent.com/yourusername/whisper-transcriber/main/docs/images/demo.png)

## ✨ Features

- 🗣️ **Accurate Speech Recognition** powered by OpenAI's Whisper models
- 📂 **Single or Batch Processing** - transcribe one file or multiple files at once
- 🌐 **Multiple Language Support** - works with numerous languages and accents
- 🔄 **Model Selection** - choose from tiny to large models based on your needs
- 💾 **Automatic Saving** - transcriptions saved with timestamps for easy reference
- 🖥️ **Simple Web Interface** - no coding required to use
- 📱 **Responsive Design** - works on desktop and mobile devices

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Usage Guide](#-usage-guide)
- [Model Options](#-model-options)
- [Supported File Formats](#-supported-file-formats)
- [Tips for Better Results](#-tips-for-better-results)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🔧 Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)
- FFmpeg (for audio processing)

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/whisper-transcriber.git
cd whisper-transcriber
```

### Step 2: Create a virtual environment (recommended)

```bash
python -m venv venv
```

Activate it:

**Windows**:
```bash
venv\Scripts\activate
```

**macOS/Linux**:
```bash
source venv/bin/activate
```

### Step 3: Install dependencies

```bash
pip install -r requirements.txt
```

> 📝 **Note**: If you don't have FFmpeg installed:
> - **Windows**: Download from [here](https://ffmpeg.org/download.html) and add to PATH
> - **macOS**: `brew install ffmpeg`
> - **Ubuntu/Debian**: `sudo apt update && sudo apt install ffmpeg`

## 🚀 Quick Start

1. Run the application:

```bash
python app.py
```

2. Open your browser and go to:
```
http://127.0.0.1:7860
```

3. Select a Whisper model, upload an audio file, and click "Transcribe"

4. Download the transcription text file when complete

## 🔍 How It Works

Whisper Transcriber combines OpenAI's state-of-the-art Whisper speech recognition model with a user-friendly Gradio interface. Here's what happens behind the scenes:

1. **Audio Input**: Upload your audio file(s) through the Gradio interface
2. **Model Loading**: The selected Whisper model is loaded into memory
3. **Transcription**: Whisper processes the audio and converts speech to text
4. **Output**: Results are displayed in the interface and saved as a text file

The application uses cache management to avoid reloading models when processing multiple files with the same model, making batch processing efficient.

## 📚 Usage Guide

### Single File Transcription

1. Go to the "Single File" tab
2. Select your preferred Whisper model
3. Upload an audio file by clicking the upload area
4. Click "Transcribe"
5. View the transcription in the output box
6. Download the transcription file using the provided link

### Multiple File Transcription

1. Go to the "More Files" tab
2. Select your preferred Whisper model
3. Upload multiple audio files by clicking the upload area
4. Click "Transcribe All"
5. View the combined transcriptions in the output box
6. Download the complete transcription file using the provided link

## 📊 Model Options

| Model | Size | RAM Required | Speed | Accuracy | Best For |
|-------|------|--------------|-------|----------|----------|
| tiny  | 39M  | ~1GB         | Very Fast | Basic | Quick drafts, short clips |
| base  | 74M  | ~1GB         | Fast | Good | General purpose |
| small | 244M | ~2GB         | Medium | Better | Balanced option |
| medium | 769M | ~5GB        | Slow | Very Good | Detailed transcription |
| large | 1.5GB | ~10GB       | Very Slow | Excellent | Professional use |

## 📁 Supported File Formats

- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- FLAC (.flac)
- OGG (.ogg)
- AAC (.aac)

## 💡 Tips for Better Results

1. **Use Quality Audio**: Clearer audio with minimal background noise yields better transcriptions
2. **Choose the Right Model**: 
   - For short, simple recordings, "tiny" or "base" may be sufficient
   - For important meetings or interviews, consider "medium" or "large"
3. **Processing Long Files**: Split very long audio files for better results
4. **Memory Management**: Larger models require more RAM - ensure your system has enough
5. **Batch Processing**: Group similar audio files together for consistent results

## 🔧 Troubleshooting

### Common Issues

1. **"CUDA out of memory"**
   - Solution: Select a smaller model or free up GPU memory
   
2. **Slow processing times**
   - Solution: Use a smaller model, consider GPU acceleration if available
   
3. **Poor transcription quality**
   - Solution: Check audio quality, try a larger model, ensure audio is clear

### Getting Help

If you encounter any issues not covered here, please [open an issue](https://github.com/yourusername/whisper-transcriber/issues) on GitHub.

## 👥 Contributing

Contributions are welcome! If you'd like to improve Whisper Transcriber:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p style="text-align: center;">
  Made with ❤️ by <a href="https://github.com/Sarracin0" target="_blank" rel="noopener noreferrer">Raffaele Zarrelli</a>
</p>
