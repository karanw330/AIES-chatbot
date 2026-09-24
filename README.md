# RAG chatbot (AIES project) 🤖💧

An intelligent chatbot designed to provide insights and answer queries about any pdf, this project leverages LLMs, vector databases to deliver accurate, contextual responses about information provided by the pdf.

## Overview

This chatbot combines multiple advanced technologies to provide a comprehensive retrieval system:

- **LLM-Powered Responses**: Uses Google's Gemini 3.5 Flash Lite for intelligent query understanding and response generation
- **Vector Search**: Employs Chroma vector database with HuggingFace embeddings for semantic search over the information
- **Web UI**: FastAPI backend with a responsive React frontend for seamless interaction


## Features

✨ **Intelligent Query Processing**
- Natural language query understanding
- Automatic SQL query generation for data retrieval
- Context-aware responses using both theoretical knowledge and real data


🗺️ **Visual Data Representation**
- Structured JSON responses 
- Markdown support in the frontend

🚀 **Modern Architecture**
- FastAPI backend for high-performance API endpoints
- CORS-enabled for cross-origin requests
- Async request handling
- Structured output using Pydantic models

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework for building APIs
- **LangChain** - Framework for building LLM applications
- **Google Generative AI** - Gemini 3.5 Flash Lite LLM model
- **Chroma** - Vector database for semantic search
- **HuggingFace** - Pre-trained embeddings (intfloat/e5-large-v2)
- **SQLAlchemy** - ORM for database operations

### Frontend
- **React** (running on localhost:5173)
- **TypeScript/JavaScript**


## Installation

### Prerequisites
- Python 3.8+
- Node.js (for frontend)
- Google API Key (for Gemini LLM)

### Backend Setup

1. **Clone the repository**


2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   ```

5. **Run the backend server**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd chatbotUI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`


## How It Works

### Query Processing Pipeline

1. **Input Processing**: User query is received via FastAPI endpoint
2. **Vector Search**: Query is embedded and matched against documentation in Chroma vector store
5. **Context Compilation**: Theory from vector search 
6. **Response Generation**: LLM generates a structured response with summary 
7. **JSON Response**: Result is formatted and returned to frontend

### Key Components

- **Text Splitter**: Chunks documents into 500-character segments with 70-character overlap for better retrieval
- **Embedding Model**: Uses `intfloat/e5-large-v2` for semantic similarity
- **LLM Model**: Google's Gemini 2.5 Flash for fast and accurate responses

## Configuration

### Embedding Model
- Current: `intfloat/e5-large-v2` (from HuggingFace)
- Customizable in `main.py` line 117

### Chunk Parameters
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 70 characters
- Adjustable in `main.py` lines 105-108

### Retriever Settings
- **Search Type**: Similarity search
- **K (Top Results)**: 2 documents
- Modifiable in `main.py` line 177

## Environment Variables

Create a `.env` file with the following variables:

```env
GEMINI_API_KEY=your_api_key_here
# Add other environment variables as needed
```

## Usage Example

1. Start both backend and frontend servers
2. Open the chatbot UI at `http://localhost:5173`
3. Start asking questions


## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is built for the Smart India Hackathon. Check the repository for specific license details.

## Contact & Support

For issues, questions, or suggestions, please create an issue in the repository.

## Acknowledgments

- Google Cloud for Gemini API
- HuggingFace for embeddings
- LangChain community for excellent LLM framework

