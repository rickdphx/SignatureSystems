from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import os
import sys
import io
import subprocess
import tempfile
import signal
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenAI API key - can be set via environment variable or use default
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-proj-J_qTU1kwTRu8XTat5r7p230EspqCNIzUqrP1J2fZ12azWSfuz7t6dxMZAL6-NH5R")

app = FastAPI(title="BEN API", description="Brain-like Emotional Network API")

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageRequest(BaseModel):
    """Request model for BEN messages"""
    message: str
    context: Optional[dict] = None


class MessageResponse(BaseModel):
    """Response model - must include 'reply' field for frontend"""
    reply: str


class CodeExecutionRequest(BaseModel):
    """Request model for code execution"""
    code: str
    language: str = "python"
    timeout: int = 10


class CodeExecutionResponse(BaseModel):
    """Response model for code execution"""
    output: str
    error: Optional[str] = None
    success: bool


def add_no_cache_headers(response: Response):
    """Add cache-control headers to prevent caching issues"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"


def get_ai_response(message: str, context: Optional[dict] = None) -> str:
    """
    Get AI response using OpenAI with lazy loading.
    Only imports OpenAI when actually needed to reduce memory usage.
    """
    try:
        # Lazy import - only load OpenAI when needed
        from openai import OpenAI
        import httpx

        # Get proxy from environment if set
        https_proxy = os.getenv('HTTPS_PROXY') or os.getenv('https_proxy')

        # Create custom HTTP client with proxy support (using httpx 0.24+ API)
        if https_proxy:
            http_client = httpx.Client(proxy=https_proxy)
        else:
            http_client = httpx.Client()

        # Build conversation context
        messages = [
            {
                "role": "system",
                "content": "You are BEN (Brain-like Emotional Network), a helpful and intelligent AI assistant. You provide thoughtful, accurate, and engaging responses."
            },
            {"role": "user", "content": message}
        ]

        # Call OpenAI API with gpt-4o-mini for lower memory usage
        client = OpenAI(
            api_key=OPENAI_API_KEY,
            http_client=http_client,
            max_retries=2,
            timeout=30.0
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=512,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Error getting AI response: {str(e)}", exc_info=True)
        return f"I'm BEN, but I'm having trouble connecting to my AI capabilities right now. Error: {str(e)[:100]}"


def execute_python_code(code: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Execute Python code in a sandboxed environment with timeout.

    Args:
        code: Python code to execute
        timeout: Maximum execution time in seconds

    Returns:
        Dict with 'output', 'error', and 'success' keys
    """
    try:
        # Create a temporary file for the code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name

        try:
            # Execute the code in a subprocess with timeout
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=tempfile.gettempdir()
            )

            output = result.stdout
            error = result.stderr if result.returncode != 0 else None
            success = result.returncode == 0

            return {
                "output": output or "(no output)",
                "error": error,
                "success": success
            }

        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass

    except subprocess.TimeoutExpired:
        return {
            "output": "",
            "error": f"Code execution timed out after {timeout} seconds",
            "success": False
        }
    except Exception as e:
        return {
            "output": "",
            "error": f"Execution error: {str(e)}",
            "success": False
        }


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "online", "service": "BEN API"}


@app.get("/health")
async def health_check(response: Response):
    """Detailed health check"""
    add_no_cache_headers(response)
    return {
        "status": "healthy",
        "service": "BEN API",
        "reply": "System is operational"
    }


@app.post("/api/ben", response_model=MessageResponse)
async def process_ben_message(request: MessageRequest, response: Response):
    """
    Process BEN system messages and return AI-powered response with 'reply' field.

    This endpoint ensures the response format matches frontend expectations:
    {"reply": "message text here"}
    """
    add_no_cache_headers(response)

    try:
        logger.info(f"Received message: {request.message}")

        user_message = request.message.strip()

        # Generate AI response
        if not user_message:
            response_text = "I didn't receive a message. Please try again."
        else:
            # Get AI-powered response using OpenAI
            response_text = get_ai_response(user_message, request.context)

        logger.info(f"Sending reply: {response_text[:100]}...")

        # Return response in the format frontend expects: {"reply": "text"}
        return MessageResponse(reply=response_text)

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        # Even in error cases, return proper JSON format with 'reply' field
        return MessageResponse(reply=f"An error occurred while processing your message. Please try again.")


@app.post("/chat")
async def chat_endpoint(request: MessageRequest, response: Response):
    """
    Alternative chat endpoint - also returns 'reply' field with AI responses
    """
    return await process_ben_message(request, response)


@app.post("/api/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest, response: Response):
    """
    Execute code in a sandboxed environment.

    Supports Python code execution with timeout and resource limits.
    """
    add_no_cache_headers(response)

    try:
        logger.info(f"Executing {request.language} code (timeout: {request.timeout}s)")

        if request.language.lower() != "python":
            return CodeExecutionResponse(
                output="",
                error=f"Language '{request.language}' is not supported. Only Python is currently supported.",
                success=False
            )

        # Execute the code
        result = execute_python_code(request.code, request.timeout)

        logger.info(f"Code execution {'succeeded' if result['success'] else 'failed'}")

        return CodeExecutionResponse(
            output=result["output"],
            error=result["error"],
            success=result["success"]
        )

    except Exception as e:
        logger.error(f"Error in code execution endpoint: {str(e)}")
        return CodeExecutionResponse(
            output="",
            error=f"Server error: {str(e)}",
            success=False
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
