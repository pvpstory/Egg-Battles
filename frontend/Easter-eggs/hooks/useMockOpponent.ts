import { useState } from 'react';

export type GameLocation = 1 | 2 | 3;

export const useMockOpponent = () => {
  const [isThinking, setIsThinking] = useState(false);

  const getRandomLocation = (): GameLocation => {
    return (Math.floor(Math.random() * 3) + 1) as GameLocation;
  };

  const getDefenseSelection = async (): Promise<GameLocation> => {
    setIsThinking(true);
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsThinking(false);
    return getRandomLocation();
  };

  const getAttackAction = async (): Promise<{ location: GameLocation; isPerfect: boolean }> => {
    setIsThinking(true);
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsThinking(false);
    
    return {
      location: getRandomLocation(),
      isPerfect: Math.random() > 0.4, // 60% chance of "perfect strike" for the bot
    };
  };

  return {
    isThinking,
    getDefenseSelection,
    getAttackAction,
  };
};
