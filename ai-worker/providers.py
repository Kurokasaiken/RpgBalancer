#!/usr/bin/env python3
"""Multi-provider configuration for AI worker.

Supports OpenRouter, Gemini, and Cerebras providers with OpenAI-compatible endpoints.

NOTE: The PROVIDERS dictionary below is a WHITELIST/FALLBACK of models known to be
suitable for coding tasks. The actual available models are fetched dynamically via
fetch_available_models(). This whitelist prevents non-coding models (e.g., embedding,
audio models) from being selected by mistake.
"""

import os
import time
from typing import Dict, List, Tuple

import requests

PROVIDERS = {
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
        "models": ["qwen/qwen3-coder:free", "meta-llama/llama-3.3-70b-instruct:free"],
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "api_key_env": "GEMINI_API_KEY",
        "models": ["gemini-2.5-flash"],
    },
    "cerebras": {
        "base_url": "https://api.cerebras.ai/v1",
        "api_key_env": "CEREBRAS_API_KEY",
        "models": ["llama-3.3-70b"],
    },
}

# Cache for available models: {provider_name: (models_list, timestamp)}
_MODELS_CACHE: Dict[str, Tuple[List[str], float]] = {}
_CACHE_TTL_SECONDS = 600  # 10 minutes


def get_provider_config(provider_name: str) -> Dict:
    """Get configuration for a specific provider."""
    if provider_name not in PROVIDERS:
        raise ValueError(f"Unknown provider: {provider_name}")
    return PROVIDERS[provider_name]


def get_provider_api_key(provider_name: str) -> str:
    """Get API key for a specific provider from environment."""
    config = get_provider_config(provider_name)
    api_key = os.environ.get(config["api_key_env"])
    if not api_key:
        raise ValueError(f"API key not found for {provider_name}: {config['api_key_env']} not set")
    return api_key


def get_all_provider_model_pairs() -> List[Tuple[str, str]]:
    """Get all (provider, model) pairs in round-robin order.
    
    Returns list of tuples where each tuple is (provider_name, model_name).
    Ordered round-robin: first model from each provider, then second model from each, etc.
    """
    pairs = []
    max_models = max(len(config["models"]) for config in PROVIDERS.values())
    
    for i in range(max_models):
        for provider_name, config in PROVIDERS.items():
            if i < len(config["models"]):
                pairs.append((provider_name, config["models"][i]))
    
    return pairs


def get_available_providers() -> List[str]:
    """Get list of providers with valid API keys configured."""
    available = []
    for provider_name in PROVIDERS:
        try:
            get_provider_api_key(provider_name)
            available.append(provider_name)
        except ValueError:
            continue
    return available


def get_base_url(provider_name: str) -> str:
    """Get base URL for a specific provider."""
    return get_provider_config(provider_name)["base_url"]


def fetch_available_models(provider_name: str) -> List[str]:
    """Fetch available models from provider's /models endpoint.

    Uses a 10-minute in-memory cache. Falls back to hardcoded whitelist if
    the API call fails (provider down, endpoint unavailable, etc.).

    Args:
        provider_name: Name of the provider (e.g., "openrouter", "gemini", "cerebras")

    Returns:
        List of model IDs available for the provider
    """
    # Check cache
    cached = _MODELS_CACHE.get(provider_name)
    if cached:
        models_list, timestamp = cached
        if time.time() - timestamp < _CACHE_TTL_SECONDS:
            return models_list

    # Fetch from API
    try:
        api_key = get_provider_api_key(provider_name)
        base_url = get_base_url(provider_name)
        url = f"{base_url}/models"

        headers = {
            "Authorization": f"Bearer {api_key}",
        }

        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()

        data = response.json()
        available_models = []

        # Parse models from response (OpenAI-compatible format)
        if "data" in data:
            for model in data["data"]:
                model_id = model.get("id")
                if model_id:
                    available_models.append(model_id)

        # Update cache
        _MODELS_CACHE[provider_name] = (available_models, time.time())
        return available_models

    except (requests.RequestException, ValueError, KeyError) as e:
        # Fallback to hardcoded whitelist with warning
        print(f"[WARN] Failed to fetch models from {provider_name}: {e}")
        print(f"[WARN] Using hardcoded whitelist as fallback")
        config = get_provider_config(provider_name)
        return config["models"]
