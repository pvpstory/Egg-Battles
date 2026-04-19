import random
import uuid
import asyncio

class GameManager:
    def __init__(self):
        self.waiting_queue = [] # list of sid
        self.games = {} # room_id -> game_state
        self.sid_to_room = {}
        self.sio = None  # To be set from main.py

    def add_to_queue(self, sid):
        if sid not in self.waiting_queue:
            self.waiting_queue.append(sid)
        return self.try_match()

    def remove_from_queue(self, sid):
        if sid in self.waiting_queue:
            self.waiting_queue.remove(sid)

    def try_match(self):
        if len(self.waiting_queue) >= 2:
            p1 = self.waiting_queue.pop(0)
            p2 = self.waiting_queue.pop(0)
            room_id = str(uuid.uuid4())
            
            # Initial state
            self.games[room_id] = {
                "players": {
                    p1: {"hp": 2, "shaken": False, "role": None, "action": None},
                    p2: {"hp": 2, "shaken": False, "role": None, "action": None}
                },
                "status": "waiting_shake",
                "round": 0,
                "current_phase": None,  # "defender_turn" or "attacker_turn"
            }
            self.sid_to_room[p1] = room_id
            self.sid_to_room[p2] = room_id
            return room_id, p1, p2
        return None

    def get_room(self, sid):
        return self.sid_to_room.get(sid)

    async def handle_shake(self, sid):
        room_id = self.sid_to_room.get(sid)
        if not room_id:
            return
        
        game = self.games[room_id]
        if game["status"] != "waiting_shake":
            return
            
        game["players"][sid]["shaken"] = True
        
        all_shaken = all(p["shaken"] for p in game["players"].values())
        if all_shaken:
            game["status"] = "playing"
            game["round"] = 1
            
            p1, p2 = list(game["players"].keys())
            roles = ["attacker", "defender"]
            random.shuffle(roles)
            
            game["players"][p1]["role"] = roles[0]
            game["players"][p2]["role"] = roles[1]

            await self.sio.emit('game_start', room=room_id)
            await self.start_defender_turn(room_id)

    async def start_defender_turn(self, room_id):
        game = self.games.get(room_id)
        if not game or game["status"] != "playing":
            return
            
        game["current_phase"] = "defender_turn"
        
        # Clear previous actions
        for p in game["players"].values():
            p["action"] = None
            
        # Emit round start indicating defender's turn
        for p_sid, p_data in game["players"].items():
            await self.sio.emit('round_start', {
                'role': p_data['role'],
                'hp': p_data['hp'],
                'round': game['round'],
                'phase': 'defender_turn'
            }, to=p_sid)
            
        # Start 10-second timeout task
        asyncio.create_task(self.defender_timeout_task(room_id, game['round']))

    async def defender_timeout_task(self, room_id, round_num):
        await asyncio.sleep(10)
        game = self.games.get(room_id)
        if not game or game["status"] != "playing" or game["round"] != round_num or game["current_phase"] != "defender_turn":
            return # State changed, ignore timeout
            
        # If we are here, defender didn't choose. Auto-fill.
        defender_sid = [sid for sid, p in game["players"].items() if p["role"] == "defender"][0]
        if game["players"][defender_sid]["action"] is None:
            print(f"Defender {defender_sid} timed out, picking random.")
            game["players"][defender_sid]["action"] = {
                "location": random.choice([1, 2, 3]),
                "qte_success": False
            }
            # Move to attacker turn
            await self.start_attacker_turn(room_id)

    async def start_attacker_turn(self, room_id):
        game = self.games.get(room_id)
        if not game or game["status"] != "playing":
            return
            
        game["current_phase"] = "attacker_turn"
        
        # Notify that attacker can now choose
        await self.sio.emit('phase_change', {'phase': 'attacker_turn'}, room=room_id)
        
        # Start 10-second timeout task
        asyncio.create_task(self.attacker_timeout_task(room_id, game['round']))

    async def attacker_timeout_task(self, room_id, round_num):
        await asyncio.sleep(10)
        game = self.games.get(room_id)
        if not game or game["status"] != "playing" or game["round"] != round_num or game["current_phase"] != "attacker_turn":
            return # State changed, ignore timeout
            
        # If we are here, attacker didn't choose. Auto-fill.
        attacker_sid = [sid for sid, p in game["players"].items() if p["role"] == "attacker"][0]
        if game["players"][attacker_sid]["action"] is None:
            print(f"Attacker {attacker_sid} timed out, picking random.")
            game["players"][attacker_sid]["action"] = {
                "location": random.choice([1, 2, 3]),
                "qte_success": False
            }
            # Resolve round
            await self.resolve_round(room_id)

    async def submit_action(self, sid, location, qte_success=False):
        room_id = self.sid_to_room.get(sid)
        if not room_id:
            return

        game = self.games.get(room_id)
        if not game or game["status"] != "playing":
            return

        role = game["players"][sid]["role"]
        phase = game["current_phase"]

        if role == "defender" and phase == "defender_turn":
            # Defender submitted
            game["players"][sid]["action"] = {
                "location": location,
                "qte_success": qte_success
            }
            # Immediately move to attacker turn
            await self.start_attacker_turn(room_id)
            
        elif role == "attacker" and phase == "attacker_turn":
            # Attacker submitted
            game["players"][sid]["action"] = {
                "location": location,
                "qte_success": qte_success
            }
            # Immediately resolve round
            await self.resolve_round(room_id)

    async def resolve_round(self, room_id):
        game = self.games[room_id]
        
        attacker_sid = [sid for sid, p in game["players"].items() if p["role"] == "attacker"][0]
        defender_sid = [sid for sid, p in game["players"].items() if p["role"] == "defender"][0]
        
        attacker_action = game["players"][attacker_sid]["action"]
        defender_action = game["players"][defender_sid]["action"]
        
        att_loc = attacker_action["location"]
        def_loc = defender_action["location"]
        
        hit_occurred = False
        damage = 0
        if att_loc == def_loc:
            # Chance to hit
            qte = attacker_action["qte_success"]
            chance = 0.9 if qte else 0.7
            if random.random() <= chance:
                hit_occurred = True
                damage = 1
                game["players"][defender_sid]["hp"] -= damage
                
        # Check game over
        game_over = False
        winner = None
        if game["players"][defender_sid]["hp"] <= 0:
            game_over = True
            game["status"] = "finished"
            winner = attacker_sid
            
        if not game_over:
            # swap roles
            game["players"][attacker_sid]["role"] = "defender"
            game["players"][defender_sid]["role"] = "attacker"
            game["round"] += 1
            
        result = {
            "hit": hit_occurred,
            "damage": damage,
            "attacker_loc": att_loc,
            "defender_loc": def_loc,
            "attacker_hp": game["players"][attacker_sid]["hp"],
            "defender_hp": game["players"][defender_sid]["hp"],
            "game_over": game_over,
            "winner_sid": winner,
            "next_attacker_sid": defender_sid if not game_over else None,
            "next_defender_sid": attacker_sid if not game_over else None,
            "round": game["round"]
        }
        
        await self.sio.emit('round_result', result, room=room_id)
        
        if game_over:
            await self.sio.emit('game_over', {'winner': winner}, room=room_id)
        else:
            await self.start_defender_turn(room_id)

    async def handle_disconnect(self, sid):
        self.remove_from_queue(sid)
        room_id = self.sid_to_room.get(sid)
        if room_id:
            # end game
            if room_id in self.games:
                del self.games[room_id]
            # remove sids mapped to this room
            to_remove = [k for k, v in self.sid_to_room.items() if v == room_id]
            for k in to_remove:
                del self.sid_to_room[k]
            
            if self.sio:
                await self.sio.emit('game_over', {'reason': 'opponent_disconnected'}, room=room_id)
        return None

game_manager = GameManager()
