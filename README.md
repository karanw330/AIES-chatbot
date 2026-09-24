# SIH Chatbot for INDIA Groundwater 🤖💧

An intelligent chatbot designed to provide insights and answer queries about India's groundwater data. Built for the Smart India Hackathon (SIH), this project leverages LLMs, vector databases, and SQL query generation to deliver accurate, contextual responses about groundwater levels, states, and districts across India.

## Overview

This chatbot combines multiple advanced technologies to provide a comprehensive groundwater information system:

- **LLM-Powered Responses**: Uses Google's Gemini 2.5 Flash for intelligent query understanding and response generation
- **Vector Search**: Employs Chroma vector database with HuggingFace embeddings for semantic search over groundwater documentation
- **SQL Query Generation**: Automatically generates SQL queries from natural language to fetch structured data
- **Web UI**: FastAPI backend with a responsive React frontend for seamless interaction

## Architecture

<img width="1032" height="669" alt="custom rag pipeline" src="https://github.com/user-attachments/assets/52ce84b1-b392-431f-95bf-0bb8f1966b1b" />


## Features

✨ **Intelligent Query Processing**
- Natural language query understanding
- Automatic SQL query generation for data retrieval
- Context-aware responses using both theoretical knowledge and real data

📊 **Data Integration**
- Groundwater level information from ingres_data (Word documents and CSV files)
- State-wise and district-wise groundwater data
- Support for multiple agencies (CGWB, CWC)

🗺️ **Visual Data Representation**
- Structured JSON responses with map visualization data
- State and district-level groundwater insights
- Numerical data emphasis with SQL context

🚀 **Modern Architecture**
- FastAPI backend for high-performance API endpoints
- CORS-enabled for cross-origin requests
- Async request handling
- Structured output using Pydantic models

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework for building APIs
- **LangChain** - Framework for building LLM applications
- **Google Generative AI** - Gemini 2.5 Flash LLM model
- **Chroma** - Vector database for semantic search
- **HuggingFace** - Pre-trained embeddings (intfloat/e5-large-v2)
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Local database for groundwater data
- **python-docx** - Document parsing

### Frontend
- **React** (running on localhost:5173)
- **TypeScript/JavaScript**

## Project Structure

```
SIH-chatbot-for-INDIA-groundwater/
├── main.py                    # FastAPI backend with chatbot logic
├── requirements.txt           # Python dependencies
├── chatbotUI/                 # Frontend React application
├── State_wise_2020.csv        # Groundwater state-wise data
├── ingres_data_word.docx      # Comprehensive groundwater documentation
├── ingres_data.pdf            # Groundwater reference PDF
├── ingres_data.db             # SQLite database
└── chroma_langchain_db/       # Vector store persistence
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js (for frontend)
- Google API Key (for Gemini LLM)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/karanw330/SIH-chatbot-for-INDIA-groundwater.git
   cd SIH-chatbot-for-INDIA-groundwater
   ```

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

## API Endpoints

### POST /chat
Send a query to the chatbot and receive an intelligent response.

**Request:**
```json
{
  "prompt": "What is the groundwater level in Odisha?"
}
```

**Response:**
```json
{
  "summary": "Detailed response about groundwater levels in Odisha...",
  "map_data": [
    {
      "state_or_district": "Odisha",
      "value": "Specific groundwater level data"
    }
  ]
}
```

## How It Works

### Query Processing Pipeline

1. **Input Processing**: User query is received via FastAPI endpoint
2. **Vector Search**: Query is embedded and matched against documentation in Chroma vector store
3. **SQL Query Generation**: LLM generates SQL query from user prompt using the database schema
4. **Data Retrieval**: SQL query executes against SQLite database for structured data
5. **Context Compilation**: Theory from vector search + SQL results are combined
6. **Response Generation**: LLM generates a structured response with summary and map data
7. **JSON Response**: Result is formatted and returned to frontend

### Key Components

- **Text Splitter**: Chunks documents into 500-character segments with 70-character overlap for better retrieval
- **Embedding Model**: Uses `intfloat/e5-large-v2` for semantic similarity
- **LLM Model**: Google's Gemini 2.5 Flash for fast and accurate responses
- **Database**: SQLite for structured groundwater data with SQL query support

## Configuration

### Embedding Model
- Current: `intfloat/e5-large-v2` (from HuggingFace)
- Customizable in `main.py` line 117

### Chunk Parameters
- **Chunk Size**: 500 characters
- **Chunk Overlap**: 70 characters
- Adjustable in `main.py` lines 105-108

### Retriever Settings
- **Search Type**: Similarity search
- **K (Top Results)**: 2 documents
- Modifiable in `main.py` line 177

## Environment Variables

Create a `.env` file with the following variables:

```env
GOOGLE_API_KEY=your_api_key_here
# Add other environment variables as needed
```

## Dependencies Overview

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.116.2 | Web framework |
| uvicorn | 0.35.0 | ASGI server |
| langchain | 0.3.27 | LLM framework |
| chromadb | 1.0.20 | Vector database |
| sqlalchemy | 2.0.43 | ORM |
| torch | 2.8.0 | ML framework |
| transformers | 4.56.0 | NLP models |

## Usage Example

1. Start both backend and frontend servers
2. Open the chatbot UI at `http://localhost:5173`
3. Ask questions like:
   - "What is the groundwater level in Maharashtra?"
   - "Show me district-wise groundwater data for Punjab"
   - "Compare groundwater levels across states"
   - "What are the current groundwater statistics?"

## Project Features in Development

- 🔄 Real-time groundwater data integration from INDIA-WRIS API
- 📱 Mobile-responsive UI improvements
- 🔐 User authentication and history tracking
- 📈 Analytics dashboard
- 🌐 Multi-language support
- ⚡ Performance optimizations

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
- India WRIS for groundwater data

---

**Built with ❤️ for India's groundwater management**
