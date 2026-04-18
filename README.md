# atp-architect
ATP Reference code

📘 ATP Architect

An AI-powered Embedded Systems Code Generation Platform that converts datasheets into hardware-aware C test programs (ATP – Acceptance Test Procedures) using LLMs.

It supports:

📄 Datasheet PDF analysis (RAG-style extraction)
⚙️ Hardware-aware C code generation
🧪 Built-in test (BIT) generation
🔌 I2C-based embedded simulation logic
📊 Performance logging of generated code
🚀 Features
🧠 AI Datasheet Analysis
Upload sensor/component datasheets (PDF)
Extract registers, memory maps, and test strategies
⚙️ Embedded Code Generation
Generates ready-to-compile ANSI C code
Supports:
I2C sensors
SPI peripherals
embedded Linux test flows
🔬 Hardware Modes
CPU optimized execution
Intel Arc GPU style parallel logic (simulated)
NPU-style low-latency optimization
🧪 Built-in Testing (BIT)
Manufacturer ID validation
Device ID validation
Hardware integrity checks
⚡ Functional Testing
Open-circuit detection
Threshold alerts
Status register monitoring
📊 Performance Logging
Execution time tracking
Hardware comparison logs
SQLite history storage
🏗️ Architecture
Frontend (React)
    ↓
FastAPI Backend
    ↓
Ollama LLM (LLaMA3 / CodeLLaMA)
    ↓
Embedded C Code Generator
    ↓
SQLite History DB
🖥️ Tech Stack
Backend
FastAPI
SQLite
Ollama (LLMs)
PyMuPDF (PDF parsing)
Frontend
React.js
Axios
Tailwind CSS (UI styling)
AI Models
LLaMA 3.1 (analysis)
CodeLLaMA (C code generation)
📦 Installation
1. Clone repo
git clone https://github.com/NarendraReddy203/atp-architect.git
cd atp-architect
2. Backend setup
cd backend
pip install fastapi uvicorn ollama pymupdf

Run backend:

uvicorn main:app --reload --port 8000
3. Frontend setup
cd frontend
npm install
npm start
📡 API Endpoints
🔹 POST /propose

Upload datasheet PDF and get analysis

🔹 POST /generate

Generate embedded C test code

🔹 GET /history

Fetch previous generated results

🧪 Example Workflow
Upload sensor datasheet (PDF)
AI extracts registers & logic
User adds test constraints
Select hardware target:
CPU
Arc GPU
NPU
Generate main.c
Download + compile
📂 Project Structure
atp-architect/
│
├── backend/
│   ├── main.py
│   ├── atp_vault.db
│   └── storage/
│
├── frontend/
│   ├── src/
│   └── App.js
│
└── README.md
⚠️ Notes
Requires Ollama running locally
Ensure model availability:
llama3.1
codellama:7b-instruct

Start Ollama:

ollama serve
🔮 Future Enhancements
Auto register-map generator from PDF
Multi-sensor test suites
FPGA simulation support
CI-based embedded test validation
Docker deployment
👨‍💻 Author

Narendra Reddy
