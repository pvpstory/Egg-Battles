import { useState, useEffect, useRef } from 'react';
import { GameLocation, useMockOpponent } from './useMockOpponent';

export type BattlePhase = 
  | 'INIT' 
  | 'DEFENDER_CHOOSING' 
  | 'ATTACKER_CHOOSING' 
  | 'QTE' 
  | 'RESOLUTION' 
  | 'GAME_OVER';

export type Role = 'PLAYER' | 'BOT';

export type ResolutionResult = {
  attackerTarget: GameLocation;
  defenderTarget: GameLocation;
  isHit: boolean;
  isPerfect: boolean;
  qteSuccess: boolean;
};

export const useBattleLogic = () => {
  const mockOpponent = useMockOpponent();

  const [phase, setPhase] = useState<BattlePhase>('INIT');
  
  // Game state
  const [playerHP, setPlayerHP] = useState(2);
  const [opponentHP, setOpponentHP] = useState(2);
  const [attacker, setAttacker] = useState<Role>('PLAYER');
  
  // Turn state
  const [timer, setTimer] = useState(10);
  const [defenderTarget, setDefenderTarget] = useState<GameLocation | null>(null);
  const [attackerTarget, setAttackerTarget] = useState<GameLocation | null>(null);
  
  // Resolution Info for animations
  const [resolutionTarget, setResolutionTarget] = useState<ResolutionResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to pick random choice for timeout
  const getRandomChoice = (): GameLocation => {
    return (Math.floor(Math.random() * 3) + 1) as GameLocation;
  };

  const startTimer = (onTimeout: () => void) => {
    setTimer(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // INITIALIZATION
  useEffect(() => {
    if (phase === 'INIT') {
      const startAttacker = Math.random() > 0.5 ? 'PLAYER' : 'BOT';
      setAttacker(startAttacker);
      
      // Delay before starting
      const t = setTimeout(() => {
        startRound(startAttacker);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const startRound = (currentAttacker: Role) => {
    setDefenderTarget(null);
    setAttackerTarget(null);
    setResolutionTarget(null);
    setPhase('DEFENDER_CHOOSING');
  };

  // PHASE MANAGEMENT
  useEffect(() => {
    if (phase === 'DEFENDER_CHOOSING') {
      startTimer(() => {
        if (attacker === 'PLAYER') {
          // Bot is defender, but if bot timeouts (shouldn't happen with mock, but just in case)
          handleDefenderChoice(getRandomChoice());
        } else {
          // Player is defender and timed out
          handleDefenderChoice(getRandomChoice());
        }
      });

      if (attacker === 'PLAYER') {
        // Bot is the defender
        mockOpponent.getDefenseSelection().then((choice) => {
          if (phase === 'DEFENDER_CHOOSING') { // Check if we haven't timed out or moved on
            handleDefenderChoice(choice);
          }
        });
      }
    } else if (phase === 'ATTACKER_CHOOSING') {
      startTimer(() => {
        if (attacker === 'BOT') {
          handleAttackerChoice(getRandomChoice());
        } else {
          // Player timed out
          handleAttackerChoice(getRandomChoice());
        }
      });

      if (attacker === 'BOT') {
        mockOpponent.getAttackAction().then((action) => {
          if (phase === 'ATTACKER_CHOOSING') {
            handleBotAttackerAction(action.location, action.isPerfect);
          }
        });
      }
    }
    
    return stopTimer;
  }, [phase, attacker]);

  // ACTIONS
  const handleDefenderChoice = (choice: GameLocation) => {
    stopTimer();
    setDefenderTarget(choice);
    // Add small delay before going to attacker choosing, for better UX
    setTimeout(() => {
      setPhase('ATTACKER_CHOOSING');
    }, 500);
  };

  const handleAttackerChoice = (choice: GameLocation) => {
    stopTimer();
    setAttackerTarget(choice);
    // If player is attacker, immediately resolve (no QTE)
    if (attacker === 'PLAYER') {
      setTimeout(() => {
        resolveTurn(choice, defenderTarget!, true, true);
      }, 500);
    }
  };

  const handleBotAttackerAction = (choice: GameLocation, isPerfect: boolean) => {
    stopTimer();
    setAttackerTarget(choice);
    // Bot skips visual QTE, resolve immediately after short delay
    setTimeout(() => {
      resolveTurn(choice, defenderTarget!, isPerfect, isPerfect); 
      // bot's qteSuccess = isPerfect for simplicity
    }, 500);
  };

  const handlePlayerQteResult = (isPerfectGreenZone: boolean) => {
    if (phase !== 'QTE') return;
    resolveTurn(attackerTarget!, defenderTarget!, isPerfectGreenZone, isPerfectGreenZone);
  };

  const resolveTurn = (
    attTarget: GameLocation, 
    defTarget: GameLocation, 
    qteSuccess: boolean, 
    isPerfect: boolean
  ) => {
    setPhase('RESOLUTION');

    const guessedRight = attTarget === defTarget;
    let hit = false;

    if (guessedRight) {
        hit = true; // 100% chance to hit on correct guess
    }

    setResolutionTarget({
      attackerTarget: attTarget,
      defenderTarget: defTarget,
      isHit: hit,
      isPerfect: true, // Always perfect since QTE is removed
      qteSuccess: true
    });

    // We let the UI read phase === 'RESOLUTION' and `resolutionTarget`
    // The UI must call `finishResolution` when animations end.
  };

  const finishResolution = () => {
    if (phase !== 'RESOLUTION' || !resolutionTarget) return;

    // Apply outcome
    let nextPlayerHp = playerHP;
    let nextBotHp = opponentHP;

    if (resolutionTarget.isHit) {
      if (attacker === 'PLAYER') nextBotHp -= 1;
      else nextPlayerHp -= 1;
    }

    setPlayerHP(nextPlayerHp);
    setOpponentHP(nextBotHp);

    if (nextPlayerHp <= 0 || nextBotHp <= 0) {
      setPhase('GAME_OVER');
    } else {
      // Swap roles
      const nextAttacker = attacker === 'PLAYER' ? 'BOT' : 'PLAYER';
      setAttacker(nextAttacker);
      startRound(nextAttacker);
    }
  };

  // User bound actions
  const selectDefenderLocation = (location: GameLocation) => {
    if (phase === 'DEFENDER_CHOOSING' && attacker === 'BOT') {
      handleDefenderChoice(location);
    }
  };

  const selectAttackerLocation = (location: GameLocation) => {
    if (phase === 'ATTACKER_CHOOSING' && attacker === 'PLAYER') {
      handleAttackerChoice(location);
    }
  };

  const playAgain = () => {
    setPlayerHP(2);
    setOpponentHP(2);
    setPhase('INIT');
  };

  return {
    phase,
    timer,
    playerHP,
    opponentHP,
    attacker,
    defenderTarget,
    attackerTarget,
    resolutionTarget,
    selectDefenderLocation,
    selectAttackerLocation,
    handlePlayerQteResult,
    finishResolution,
    playAgain,
    isBotThinking: mockOpponent.isThinking,
  };
};
