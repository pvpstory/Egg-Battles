import socketio
import asyncio
import sys

sio1 = socketio.AsyncClient()
sio2 = socketio.AsyncClient()

state = {"room_id": None, "p1_ready": False, "p2_ready": False}

@sio1.on('match_found')
async def match_found_1(data):
    print(f"P1 Match found: {data}")
    state["room_id"] = data['room_id']
    await sio1.emit('shake')

@sio2.on('match_found')
async def match_found_2(data):
    print(f"P2 Match found: {data}")
    await sio2.emit('shake')

@sio1.on('round_start')
async def round_start_1(data):
    print(f"P1 Round start: {data}")
    await asyncio.sleep(0.5)
    role = data['role']
    # If attacker, guess location 1, if defender, defend location 1
    # We simulate them picking the same location to check logic
    await sio1.emit('submit_action', {'location': 1, 'qte_success': True})

@sio2.on('round_start')
async def round_start_2(data):
    print(f"P2 Round start: {data}")
    await asyncio.sleep(0.5)
    await sio2.emit('submit_action', {'location': 1, 'qte_success': True})

@sio1.on('round_result')
async def round_result(data):
    print(f"Round result: {data}")

@sio1.on('game_over')
async def game_over(data):
    print(f"Game over! {data}")
    await sio1.disconnect()
    await sio2.disconnect()
    sys.exit(0)

@sio1.on('disconnect')
async def on_disconnect():
    print("P1 Disconnected")

@sio2.on('disconnect')
async def on_disconnect2():
    print("P2 Disconnected")

async def main():
    try:
        await sio1.connect('http://localhost:8000')
        await sio2.connect('http://localhost:8000')

        await sio1.emit('join_queue')
        await sio2.emit('join_queue')

        await sio1.wait()
        await sio2.wait()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
