# dhanhq_api.py

import asyncio
import httpx
from dotenv import load_dotenv
import os

load_dotenv()

# Dhan credentials (from .env)
DHAN_ACCESS_TOKEN = os.getenv("DHAN_ACCESS_TOKEN")
DHAN_CLIENT_ID = os.getenv("DHAN_CLIENT_ID")

# Base endpoint (POST /v2/optionchain)
BASE_URL = "https://api.dhan.co/v2/optionchain"

# Your configured indices (update security_id and expiries as needed)
INDEX_CONFIG = {
    "NIFTY": {
        "security_id": "13",    # <-- your real ID from instruments csv
        "segment": "IDX_I",
        "expiries": ["2025-09-02"]
    },
}

# In-memory cache for option chains
# key: (index_name, expiry) -> value: response JSON
option_chain_cache = {}

# Perform a single POST request to the optionchain API for (security_id, segment, expiry)
async def fetch_option_chain(index_name: str, security_id: str, segment: str, expiry: str):
    headers = {
        "access-token": DHAN_ACCESS_TOKEN,
        "client-id": DHAN_CLIENT_ID,
        "Content-Type": "application/json"
    }
    payload = {
        "UnderlyingScrip": int(security_id),  # docs expect int
        "UnderlyingSeg": segment,
        "Expiry": expiry  # YYYY-MM-DD
    }

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(BASE_URL, headers=headers, json=payload)
        except Exception as e:
            print(f"⚠️ Network/error fetching {index_name} ({expiry}): {e}")
            return

        if resp.status_code == 200:
            try:
                data = resp.json()
            except Exception:
                print(f"⚠️ JSON decode error for {index_name} ({expiry}), raw body: {resp.text[:400]}")
                return
            option_chain_cache[(index_name, expiry)] = data
            print(f"✅ Updated {index_name} ({expiry})")
        else:
            # Log response text to diagnose (will show reason for 404/401/etc)
            print(f"❌ Failed to fetch {index_name} ({expiry}): {resp.status_code} - {resp.text[:500]}")

# Poll all configured indices/expiries every 3 seconds
async def poll_option_chains():
    while True:
        tasks = []
        for index_name, cfg in INDEX_CONFIG.items():
            for expiry in cfg.get("expiries", []):
                tasks.append(
                    fetch_option_chain(index_name, cfg["security_id"], cfg["segment"], expiry)
                )
        # Run all requests in parallel
        await asyncio.gather(*tasks)
        await asyncio.sleep(5)  # allowed frequency per docs

    