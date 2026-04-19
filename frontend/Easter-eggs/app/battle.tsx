import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { GameLocation } from '../hooks/useMockOpponent';
import { useBattleLogic } from '../hooks/useBattleLogic';
import AnimatedRN, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withSequence,
  runOnJS,
  Easing,
  delay
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function BattleScreen() {
  const router = useRouter();
  const { eggType = 'white' } = useLocalSearchParams<{ eggType: string }>();
  
  const {
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
    isBotThinking
  } = useBattleLogic();

  // Animations
  const playerX = useSharedValue(0);
  const opponentX = useSharedValue(0);
  const playerY = useSharedValue(height);
  const opponentY = useSharedValue(-height);
  const playerScale = useSharedValue(1);
  const opponentScale = useSharedValue(1);
  const qteProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  const [qteInteracted, setQteInteracted] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  // Initial Entrance Animation
  useEffect(() => {
    if (phase === 'INIT') {
        playerY.value = withSpring(0, { damping: 15 });
        opponentY.value = withSpring(0, { damping: 15 });
        playerX.value = withSpring(0);
        opponentX.value = withSpring(0);
        setResultMessage('');
    }
  }, [phase]);

  // Reset positions when returning to choice phase
  useEffect(() => {
    if (phase === 'DEFENDER_CHOOSING') {
      playerX.value = withSpring(0);
      opponentX.value = withSpring(0);
      setResultMessage('');
      setQteInteracted(false);
    }
  }, [phase]);

  // Handle QTE Start
  useEffect(() => {
    if (phase === 'QTE' && attacker === 'PLAYER') {
      setQteInteracted(false);
      qteProgress.value = 0;
      qteProgress.value = withTiming(1, { duration: 1000, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(handlePlayerQteResult)(false); // Timeout means fail
        }
      });
    }
  }, [phase, attacker]);

  // Handle Resolution Animations
  useEffect(() => {
    if (phase === 'RESOLUTION' && resolutionTarget) {
      const { attackerTarget: att, defenderTarget: def, isHit, isPerfect } = resolutionTarget;
      
      const laneMap: Record<number, number> = { 1: -140, 2: 0, 3: 140 };
      const attLane = laneMap[att];
      const defLane = laneMap[def];

      // 1. Simultaneous Diagonal/Horizontal Movement
      const DURATION = 300;
      
      if (attacker === 'PLAYER') {
         // Defender moves horizontally to defLane
         opponentX.value = withTiming(defLane, { duration: DURATION });
         // Attacker moves horizontally to attLane AND vertically to attack
         playerX.value = withTiming(attLane, { duration: DURATION });
         playerY.value = withTiming(-200, { duration: DURATION });
      } else {
         // Defender moves horizontally to defLane
         playerX.value = withTiming(defLane, { duration: DURATION });
         // Attacker moves horizontally to attLane AND vertically to attack
         opponentX.value = withTiming(attLane, { duration: DURATION });
         opponentY.value = withTiming(200, { duration: DURATION });
      }

      // 2. Evaluate outcome precisely at end of collision movement
      setTimeout(() => {
         if (isHit) {
            setResultMessage(isPerfect ? '⚡️ PERFECT CRASH! ⚡️' : 'CRASH! 💥');
            // Flash and Shake
            flashOpacity.value = withSequence(withTiming(0.8, { duration: 50 }), withTiming(0, { duration: 300 }));
            shakeX.value = withSequence(
                withTiming(15, { duration: 30 }), 
                withTiming(-15, { duration: 30 }),
                withTiming(10, { duration: 30 }),
                withTiming(0, { duration: 30 })
            );
            // Scale animation for hit and bounce Attacker back
            if (attacker === 'PLAYER') {
                opponentScale.value = withSequence(withTiming(1.3, {duration: 100}), withSpring(1));
                playerY.value = withSpring(0);
            } else {
                playerScale.value = withSequence(withTiming(1.3, {duration: 100}), withSpring(1));
                opponentY.value = withSpring(0);
            }
         } else if (att === def) {
            setResultMessage('DEFENDED! 🛡️');
            // Bounce Attacker back
            if (attacker === 'PLAYER') playerY.value = withSpring(0);
            else opponentY.value = withSpring(0);
         } else {
            setResultMessage('MISSED! 💨');
            // Animate attacker overshooting (dodge)
            if (attacker === 'PLAYER') {
                playerY.value = withSequence(withTiming(-400, { duration: 300 }), withTiming(0, { duration: 0 }));
            } else {
                opponentY.value = withSequence(withTiming(400, { duration: 300 }), withTiming(0, { duration: 0 }));
            }
         }

         // 3. End Resolution Phase and proceed game logic
         setTimeout(() => {
           finishResolution();
         }, 1500);
         
      }, DURATION);
    }
  }, [phase, resolutionTarget]);


  const onQtePress = () => {
    if (qteInteracted || phase !== 'QTE') return;
    setQteInteracted(true);
    
    // Stop animation
    const currentProgress = qteProgress.value;
    qteProgress.value = currentProgress; 

    // Compute success (Green zone 0.4 to 0.6)
    const isPerfect = currentProgress >= 0.4 && currentProgress <= 0.6;
    
    handlePlayerQteResult(isPerfect);
  };

  const playerAnimStyle = useAnimatedStyle(() => ({
    transform: [
        { translateX: playerX.value },
        { translateY: playerY.value },
        { scale: playerScale.value * 5 } 
    ],
    position: 'absolute',
    bottom: 40,
  }));

  const opponentAnimStyle = useAnimatedStyle(() => ({
    transform: [
        { translateX: opponentX.value },
        { translateY: opponentY.value },
        { scale: opponentScale.value * 5 }
    ],
    position: 'absolute',
    top: 40,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }]
  }));

  const qteBarStyle = useAnimatedStyle(() => ({
    left: `${qteProgress.value * 100}%`
  }));

  return (
    <AnimatedRN.View style={[styles.container, containerStyle]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <AnimatedRN.View 
        style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: 'white', zIndex: 1000 },
            useAnimatedStyle(() => ({ opacity: flashOpacity.value }))
        ]} 
        pointerEvents="none"
      />
      <Image 
        source={require('../assets/images/game/main_game_background.png')} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      />

      <SafeAreaView style={styles.content}>
        {/* Header HUD */}
        <View style={styles.header}>
           <View style={styles.hpContainer}>
              <Text style={styles.hpLabel}>YOU</Text>
              <Text style={styles.hpEmoji}>{Array(playerHP).fill('❤️').join('')}</Text>
           </View>
           <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
           </View>
           <View style={[styles.hpContainer, { alignItems: 'flex-end' }]}>
              <Text style={styles.hpLabel}>BOT</Text>
              <Text style={styles.hpEmoji}>{Array(opponentHP).fill('❤️').join('')}</Text>
           </View>
        </View>

        {/* Phase Info */}
         <View style={styles.infoPanel}>
           {phase === 'DEFENDER_CHOOSING' && (
              <View>
                <Text style={styles.phaseTitle}>
                  {attacker === 'BOT' ? "Choose where to hide!" : "Opponent is hiding..."}
                </Text>
                {attacker === 'BOT' && <Text style={styles.timerText}>{timer}s</Text>}
              </View>
           )}
           {phase === 'ATTACKER_CHOOSING' && (
              <View>
                <Text style={styles.phaseTitle}>
                  {attacker === 'PLAYER' ? "GUESS where to attack!" : "Opponent is attacking..."}
                </Text>
                {attacker === 'PLAYER' && <Text style={styles.timerText}>{timer}s</Text>}
              </View>
           )}
           {phase === 'RESOLUTION' && (
              <Text style={styles.resultText}>{resultMessage}</Text>
           )}
        </View>

        {/* Eggs Stage */}
        <View style={styles.stage}>
           <AnimatedRN.View style={[styles.eggWrapper, opponentAnimStyle]}>
              <Image 
                source={require('../assets/images/game/white_egg_reversed.png')} 
                style={styles.egg} 
                resizeMode="contain" 
              />
           </AnimatedRN.View>

           <AnimatedRN.View style={[styles.eggWrapper, playerAnimStyle]}>
              <Image 
                source={eggType === 'rare1' ? require('../assets/images/game/modified_egg_n1.png') : eggType === 'rare2' ? require('../assets/images/game/modified_egg_n2.png') : eggType === 'rare3' ? require('../assets/images/game/modified_egg_n3.png') : eggType === 'brown' ? require('../assets/images/game/brown_egg.png') : require('../assets/images/game/white_egg.png')} 
                style={styles.egg} 
                resizeMode="contain" 
              />
           </AnimatedRN.View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
           {(phase === 'DEFENDER_CHOOSING' || phase === 'ATTACKER_CHOOSING') && (
             <View style={styles.buttonRow}>
                {[1, 2, 3].map((pos) => {
                   const isDisabled = (phase === 'DEFENDER_CHOOSING' && attacker === 'PLAYER') ||
                                      (phase === 'ATTACKER_CHOOSING' && attacker === 'BOT');
                   const isSelected = (phase === 'DEFENDER_CHOOSING' && attacker === 'BOT' && defenderTarget === pos) ||
                                      (phase === 'ATTACKER_CHOOSING' && attacker === 'PLAYER' && attackerTarget === pos);
                   return (
                     <TouchableOpacity 
                       key={pos} 
                       style={[
                          styles.choiceButton,
                          isDisabled && styles.buttonDisabled,
                          isSelected && styles.buttonSelected
                       ]}
                       onPress={() => {
                         if (phase === 'DEFENDER_CHOOSING') selectDefenderLocation(pos as GameLocation);
                         else selectAttackerLocation(pos as GameLocation);
                       }}
                       disabled={isDisabled || isSelected}
                     >
                       <Text style={styles.choiceIcon}>{pos === 1 ? '⬅️' : pos === 2 ? '⬆️' : '➡️'}</Text>
                       <Text style={styles.choiceText}>{pos === 1 ? 'Left' : pos === 2 ? 'Center' : 'Right'}</Text>
                     </TouchableOpacity>
                   );
                })}
             </View>
           )}

           {phase === 'QTE' && attacker === 'PLAYER' && (
             <TouchableOpacity activeOpacity={1} style={styles.qteContainer} onPress={onQtePress}>
                <Text style={styles.qteHint}>TAP CAREFULLY!</Text>
                <View style={styles.qteTrack}>
                   <View style={styles.qteGreenZone} />
                   <AnimatedRN.View style={[styles.qteBar, qteBarStyle]} />
                </View>
                <Text style={styles.qtePerfectText}>PERFECT ZONE</Text>
             </TouchableOpacity>
           )}
        </View>

        {/* Game Over Modal */}
        {phase === 'GAME_OVER' && (
           <View style={styles.overlay}>
              <View style={styles.modal}>
                 <Text style={styles.modalTitle}>{playerHP > 0 ? 'YOU WIN!' : 'DEFEAT'}</Text>
                 <Text style={styles.modalScore}>The egg was {playerHP > 0 ? 'CRACKED' : 'CRACKED BY BOT'}</Text>

                 <View style={styles.rewardContainer}>
                    <Text style={styles.rewardText}>3rd game with a unique opponent!</Text>
                    <View style={styles.rewardItems}>
                       <View style={styles.rewardItem}>
                          <Text style={styles.rewardValue}>+500</Text>
                          <Image source={require('../assets/images/game/golden_feather.png')} style={styles.rewardIcon} />
                       </View>
                       {playerHP > 0 && (
                          <View style={styles.rewardItem}>
                             <Image source={require('../assets/images/game/chest_1.png')} style={styles.rewardChest} />
                          </View>
                       )}
                    </View>
                 </View>

                 <TouchableOpacity style={styles.modelButton} onPress={playAgain}>
                    <Text style={styles.modelButtonText}>Play Again</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.modelButton, { marginTop: 12, backgroundColor: '#f0f2f5' }]} onPress={() => {
                    if (playerHP > 0) {
                       router.replace({ pathname: '/game', params: { chestWon: 'true' } });
                    } else {
                       router.back();
                    }
                 }}>
                    <Text style={[styles.modelButtonText, { color: '#0b1c4c' }]}>Return to Base</Text>
                 </TouchableOpacity>
              </View>
           </View>
        )}
      </SafeAreaView>
    </AnimatedRN.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  content: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  hpContainer: { flex: 1 },
  hpLabel: { color: 'white', fontWeight: '900', fontSize: 12, marginBottom: 4, textShadowColor: 'black', textShadowRadius: 4 },
  hpEmoji: { fontSize: 32 },
  vsContainer: { width: 50, alignItems: 'center' },
  vsText: { color: 'white', fontWeight: '900', fontSize: 24, fontStyle: 'italic' },
  
  infoPanel: { height: 100, justifyContent: 'center', alignItems: 'center', zIndex: 100, marginTop: 20 },
  phaseTitle: { color: 'white', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 1, textShadowColor: 'black', textShadowRadius: 8 },
  timerText: { color: '#ff4444', fontSize: 36, fontWeight: '900', textAlign: 'center', marginTop: 10, textShadowColor: 'black', textShadowRadius: 10 },
  resultText: { color: '#fbbf24', fontSize: 32, fontWeight: '900', textAlign: 'center', textShadowColor: 'black', textShadowRadius: 10 },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  eggWrapper: { width: 60, height: 80, alignItems: 'center', justifyContent: 'center' },
  egg: { width: '100%', height: '100%' },

  controls: { height: 180, paddingHorizontal: 20, justifyContent: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  choiceButton: { 
    width: 90, 
    height: 90, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  buttonDisabled: { opacity: 0.5, backgroundColor: 'rgba(200,200,200,0.5)' },
  buttonSelected: { borderColor: '#d11241', backgroundColor: '#fff5f7' },
  choiceIcon: { fontSize: 32, marginBottom: 4 },
  choiceText: { fontSize: 13, fontWeight: 'bold', color: '#0b1c4c' },

  qteContainer: { backgroundColor: 'rgba(0,0,0,0.85)', padding: 25, borderRadius: 24, borderWidth: 2, borderColor: '#333' },
  qteHint: { color: 'white', fontWeight: '900', textAlign: 'center', marginBottom: 15, fontSize: 18, letterSpacing: 2 },
  qteTrack: { height: 40, backgroundColor: '#222', borderRadius: 20, position: 'relative', overflow: 'hidden', borderWidth: 2, borderColor: '#444' },
  qteGreenZone: { position: 'absolute', left: '40%', width: '20%', height: '100%', backgroundColor: '#00e676' },
  qteBar: { position: 'absolute', width: 6, height: '100%', backgroundColor: 'white', shadowColor: 'white', shadowRadius: 12, shadowOpacity: 1, elevation: 10 },
  qtePerfectText: { color: '#00e676', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 12, letterSpacing: 1 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30, zIndex: 2000 },
  modal: { backgroundColor: 'white', width: '100%', borderRadius: 32, padding: 40, alignItems: 'center' },
  modalTitle: { fontSize: 36, fontWeight: '900', color: '#d11241', marginBottom: 10 },
  modalScore: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  modelButton: { backgroundColor: '#0b1c4c', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 20, width: '100%' },
  modelButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },

  rewardContainer: { backgroundColor: '#f9f9f9', paddingHorizontal: 15, paddingVertical: 25, borderRadius: 15, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  rewardText: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center', fontStyle: 'italic' },
  rewardItems: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, width: '100%' },
  rewardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  rewardValue: { fontSize: 18, fontWeight: 'bold', color: '#d11241', marginRight: 6 },
  rewardIcon: { width: 80, height: 80, resizeMode: 'contain' },
  rewardChest: { width: 80, height: 80, resizeMode: 'contain' }
});
