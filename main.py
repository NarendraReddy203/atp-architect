import sqlite3
import ollama
import fitz
import shutil
import os
import re
import time
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

DB_PATH = "atp_vault.db"
STORAGE_DIR = "storage"


# =========================
# DB INIT + MIGRATION FIX
# =========================
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                module TEXT,
                code TEXT,
                hardware_target TEXT,
                execution_time REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ✅ Ensure timestamp exists
        cursor = conn.execute("PRAGMA table_info(history)")
        cols = [c[1] for c in cursor.fetchall()]
        if "timestamp" not in cols:
            conn.execute(
                "ALTER TABLE history ADD COLUMN timestamp DATETIME DEFAULT CURRENT_TIMESTAMP"
            )

    if not os.path.exists(STORAGE_DIR):
        os.makedirs(STORAGE_DIR)


@app.on_event("startup")
def startup():
    init_db()


# =========================
# MODEL
# =========================
class GenerateRequest(BaseModel):
    module: str
    user_input: str
    ai_proposal: str
    filename: str
    hardware: str


# =========================
# PROPOSE
# =========================
@app.post("/propose")
async def propose(file: UploadFile = File(...)):
    filename = os.path.basename(file.filename)
    path = os.path.join(STORAGE_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        doc = fitz.open(path)
        text = "".join([page.get_text() for page in doc[:10]])
    except Exception as e:
        return {"error": f"PDF parse failed: {str(e)}"}

    try:
        start = time.perf_counter()

        res = ollama.generate(
            model="llama3.1",
            prompt=f"Analyze datasheet:\n{text[:4000]}"
        )

        return {
            "proposal": res["response"],
            "filename": filename,
            "analysis_time": round(time.perf_counter() - start, 2),
            "status": "ok"
        }

    except Exception as e:
        return {
            "error": f"Ollama error: {str(e)}",
            "status": "failed"
        }


# =========================
# GENERATE (FIXED)
# =========================
@app.post("/generate")
async def generate(req: GenerateRequest):

    try:
        # Hardware context
        if req.hardware == "NPU":
            hw_context = "Low-latency fixed-point optimization"
        elif req.hardware == "Arc GPU":
            hw_context = "Parallel vectorized processing"
        else:
            hw_context = "Optimized CPU execution"

        prompt = f"""
Generate ANSI C main.c

Hardware: {req.hardware}
Optimization: {hw_context}

Context:
{req.ai_proposal}

User Requirements:
{req.user_input}

Rules:
- Full main()
- Include stdio.h, stdint.h
- No markdown
"""

        start = time.perf_counter()

        res = ollama.generate(
            model="codellama:7b-instruct",
            prompt=prompt
        )

        duration = round(time.perf_counter() - start, 2)

        raw_code = res.get("response", "")

        if not raw_code.strip():
            raise ValueError("Empty response from model")

        # ✅ Clean markdown
        match = re.search(r"```(?:c)?\n(.*?)```", raw_code, re.DOTALL)
        if match:
            clean_code = match.group(1).strip()
        else:
            clean_code = raw_code.replace("```", "").strip()

        # Save to DB
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT INTO history 
                (filename, module, code, hardware_target, execution_time)
                VALUES (?, ?, ?, ?, ?)
            """, (req.filename, req.module, clean_code, req.hardware, duration))

        return {
            "code": clean_code,
            "execution_time": duration,
            "hardware": req.hardware,
            "status": "ok"
        }

    except Exception as e:
        return {
            "error": f"Code generation failed: {str(e)}",
            "status": "failed"
        }


# =========================
# HISTORY (FIXED FORMAT)
# =========================
@app.get("/history")
def get_history():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.execute(
                "SELECT * FROM history ORDER BY timestamp DESC"
            )
            rows = cursor.fetchall()

        history = [
            {
                "id": r[0],
                "filename": r[1],
                "module": r[2],
                "code": r[3],
                "hardware": r[4],
                "time": r[5],
                "date": r[6],
            }
            for r in rows
        ]

        return {"history": history}

    except Exception as e:
        return {"error": str(e), "history": []}
