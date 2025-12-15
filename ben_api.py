#!/usr/bin/env python3
"""
Ben Brain API - Main FastAPI application
Provides routing and model selection for LLM tasks
"""
import os
import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse

# Import our LLM clients
try:
    from system import llm_clients
except ImportError:
    import sys
    # Add parent directory to path if not already there
    sys.path.insert(0, str(Path(__file__).parent))
    from system import llm_clients

app = FastAPI(
    title="Ben Brain API",
    description="LLM routing and orchestration service",
    version="1.0.0"
)

# Load configuration files
BASE_DIR = Path(__file__).parent
REGISTRY_PATH = BASE_DIR / "system" / "registries" / "model_registry.json"
ROUTING_PATH = BASE_DIR / "system" / "maps" / "routing_rules.json"


def load_json_file(path: Path) -> dict:
    """Load JSON configuration file"""
    try:
        if path.exists():
            with open(path, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        print(f"Warning: Could not load {path}: {e}")
        return {}


# Load registries at startup
model_registry = load_json_file(REGISTRY_PATH)
routing_rules = load_json_file(ROUTING_PATH)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Ben Brain API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/docs",
            "/openapi.json",
            "/ben/route"
        ]
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"ok": True}


@app.get("/ben/route")
async def route_task(
    task_type: str = Query(..., description="Type of task to route (e.g., 'strategy', 'long_form_writing')")
):
    """
    Route a task to the appropriate model based on task type

    Returns preferred and fallback models for the given task type
    """
    # Get routing rule for this task type
    rule = routing_rules.get(task_type)

    if not rule:
        # Default routing if task type not found
        return {
            "task_type": task_type,
            "preferred": "claude",
            "fallback": "openai",
            "status": "default_routing",
            "message": f"No specific routing rule found for '{task_type}', using defaults"
        }

    return {
        "task_type": task_type,
        "preferred": rule.get("preferred_model", "claude"),
        "fallback": rule.get("fallback_model", "openai")
    }


@app.get("/ben/models")
async def list_models():
    """List all registered models"""
    return {
        "models": model_registry,
        "count": len(model_registry)
    }


@app.get("/ben/models/{model_name}")
async def get_model_info(model_name: str):
    """Get information about a specific model"""
    if model_name not in model_registry:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")

    return {
        "model": model_name,
        "info": model_registry[model_name]
    }


@app.post("/ben/execute")
async def execute_task(
    task_type: str = Query(..., description="Type of task"),
    prompt: str = Query(..., description="Prompt to send to the model"),
    use_fallback: bool = Query(False, description="Use fallback model instead of preferred")
):
    """
    Execute a task using the appropriate model

    This is a stub implementation that demonstrates the routing
    """
    # Get routing
    rule = routing_rules.get(task_type, {})
    preferred = rule.get("preferred_model", "claude")
    fallback = rule.get("fallback_model", "openai")

    # Choose model
    model_to_use = fallback if use_fallback else preferred

    # Call the appropriate LLM client (stub)
    try:
        if model_to_use == "grok":
            response = llm_clients.call_grok(prompt)
        elif model_to_use == "claude":
            response = llm_clients.call_claude(prompt)
        elif model_to_use == "openai":
            response = llm_clients.call_openai(prompt)
        elif model_to_use == "perplexity":
            response = llm_clients.call_perplexity(prompt)
        elif model_to_use == "deepseek":
            response = llm_clients.call_deepseek(prompt)
        else:
            response = f"[unknown model: {model_to_use}]"

        return {
            "task_type": task_type,
            "model_used": model_to_use,
            "response": response,
            "status": "success"
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "task_type": task_type,
                "model_used": model_to_use,
                "error": str(e),
                "status": "error"
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
