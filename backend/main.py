from fastapi import FastAPI
import socketio
from game_logic import game_manager
import traceback

app = FastAPI()

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Pass sio instance to game_manager so it can emit events directly
game_manager.sio = sio

@app.get("/")
async def root():
    return {"message": "Egg Clash Server is running"}

@sio.event
async def connect(sid, environ, auth=None):
    print(f"Client {sid} connected", flush=True)

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected", flush=True)
    await game_manager.handle_disconnect(sid)

@sio.event
async def join_queue(sid):
    print(f"Client {sid} joining queue", flush=True)
    try:
        result = game_manager.add_to_queue(sid)
        if result:
            room_id, p1, p2 = result
            print(f"Room found {room_id}", flush=True)
            await sio.enter_room(p1, room_id)
            await sio.enter_room(p2, room_id)
            print(f"Match found! Room: {room_id}", flush=True)
            await sio.emit('match_found', {'room_id': room_id}, room=room_id)
    except Exception as e:
        print(f"Error in join_queue: {e}")
        traceback.print_exc()

@sio.event
async def shake(sid):
    print(f"Client {sid} shook", flush=True)
    await game_manager.handle_shake(sid)

@sio.event
async def submit_action(sid, data):
    print(f"Client {sid} action: {data}", flush=True)
    location = data.get('location')
    qte_success = data.get('qte_success', False)
    
    await game_manager.submit_action(sid, location, qte_success)
