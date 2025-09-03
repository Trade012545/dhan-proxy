# main.py

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dhanhq_api import poll_option_chains, option_chain_cache

app = FastAPI()

# Store active websocket connections
connected_clients = []

@app.on_event("startup")
async def start_polling():
    # Start polling DhanHQ API in the background
    asyncio.create_task(poll_option_chains())

@app.websocket("/ws/option-chain")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            # Convert tuple keys (index, expiry) to string for JSON
            json_ready_cache = {
                f"{index}|{expiry}": value
                for (index, expiry), value in option_chain_cache.items()
            }
            await websocket.send_json(json_ready_cache)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
