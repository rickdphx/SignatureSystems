"""
LLM Client Layer
Real API implementations for various LLM providers
"""
import os
import requests
from typing import Optional


def call_grok(prompt: str) -> str:
    """Call Grok (xAI) API"""
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        return f"[stub:grok] {prompt}"

    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "grok-beta",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[grok error: {str(e)}]"


def call_claude(prompt: str) -> str:
    """Call Claude (Anthropic) API"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return f"[stub:claude] {prompt}"

    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60
        )
        response.raise_for_status()
        return response.json()["content"][0]["text"]
    except Exception as e:
        return f"[claude error: {str(e)}]"


def call_openai(prompt: str) -> str:
    """Call OpenAI API"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return f"[stub:openai] {prompt}"

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4-turbo-preview",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            },
            timeout=60
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[openai error: {str(e)}]"


def call_perplexity(prompt: str) -> str:
    """Call Perplexity API"""
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        return f"[stub:perplexity] {prompt}"

    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "pplx-70b-online",
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[perplexity error: {str(e)}]"


def call_deepseek(prompt: str) -> str:
    """Call DeepSeek API"""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return f"[stub:deepseek] {prompt}"

    try:
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            },
            timeout=45
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[deepseek error: {str(e)}]"
