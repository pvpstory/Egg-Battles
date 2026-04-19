import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image, Modal, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import AnimatedRN, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withRepeat } from 'react-native-reanimated';

const globalUnlockedEggs = new Set<string>(['white', 'brown']);

const SHOP_ITEMS = [
  { id: 1, icon: '🎵', title: 'Spotify Premium', desc: '3-month sub code', price: 1000, disabled: false },
  { id: 2, icon: '📺', title: 'Sweet.tv', desc: '1 month free access', price: 500, disabled: false },
  { id: 3, icon: '📚', title: 'BookBeat', desc: '2 months free access', price: 800, disabled: false },
  { id: 4, icon: '🎧', title: 'Audioteka', desc: '30 days free', price: 500, disabled: false },
  { id: 5, icon: '☕', title: 'Costa Voucher', desc: '1 free standard coffee', price: 2500, disabled: true },
  { id: 6, icon: '📈', title: 'PKO Saving Boost', desc: '+2% interest rate for 6 mos.', price: 2000, disabled: true },
];

export default function GameScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(1);
  const [selectedEgg, setSelectedEgg] = useState('white');
  const [leaderboardScope, setLeaderboardScope] = useState('local');
  const { chestWon } = useLocalSearchParams();
  const [isSearching, setIsSearching] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [chestOpened, setChestOpened] = useState(false);
  const [newEggReceived, setNewEggReceived] = useState<string | null>(null);

  const [forceRender, setForceRender] = useState(0);

  const eggScale = useSharedValue(0.1);
  const eggOpacity = useSharedValue(0);

  const points = 1000;

  const eggAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: eggScale.value }],
    opacity: eggOpacity.value
  }));

  useEffect(() => {
    if (chestWon === 'true') {
      setShowChestModal(true);
      setChestOpened(false);
      setNewEggReceived(null);
      eggScale.value = 0.1;
      eggOpacity.value = 0;
      router.setParams({ chestWon: '' }); // Clear
    }
  }, [chestWon]);

  const handleOpenChest = () => {
    setChestOpened(true);
    const rand = Math.random();
    const rare = rand < 0.33 ? 'rare1' : rand < 0.66 ? 'rare2' : 'rare3';
    globalUnlockedEggs.add(rare);
    setNewEggReceived(rare);

    eggOpacity.value = withTiming(1, { duration: 500 });
    eggScale.value = withSpring(1, { damping: 12 });
    setForceRender(prev => prev + 1);
  };

  const handleCloseChest = () => {
    setShowChestModal(false);
    setActiveTab(2); // Go to Eggs tab
  };

  useEffect(() => {
    if (isSearching) {
      const timer = setTimeout(() => {
        setIsSearching(false);
        router.push({
          pathname: '/battle',
          params: { eggType: selectedEgg }
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSearching, selectedEgg]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.mainPlaySection}>
              <View style={styles.eggDisplayContainer}>
                <Image
                  source={selectedEgg === 'rare1' ? require('../assets/images/game/modified_egg_n1.png') : selectedEgg === 'rare2' ? require('../assets/images/game/modified_egg_n2.png') : selectedEgg === 'rare3' ? require('../assets/images/game/modified_egg_n3.png') : selectedEgg === 'white' ? require('../assets/images/game/white_egg.png') : require('../assets/images/game/brown_egg.png')}
                  style={styles.bigEggImage}
                  resizeMode="contain"
                />
              </View>
              <TouchableOpacity style={styles.playButton} onPress={() => setIsSearching(true)}>
                <Text style={styles.playButtonText}>Find Opponent</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rewardsSection}>
              <Text style={styles.sectionTitle}>Rewards</Text>
              <View style={styles.rewardsScroll}>

                {/* Center Line for Path */}
                <View style={styles.pathCenterLine} />

                {[2, 4, 6, 8, 10, 12, 14, 16].map((pts, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <View key={pts} style={[styles.pathRow, isLeft ? styles.pathRowLeft : styles.pathRowRight]}>
                      {/* Card side */}
                      <View style={[styles.pathCardContainer, isLeft ? styles.pathCardContainerLeft : styles.pathCardContainerRight]}>
                        <View style={styles.pathRewardCard}>
                          <Text style={styles.pathRewardTitle}>{pts} Games</Text>
                          {pts % 4 === 0 ? (
                            <View style={{ alignItems: 'center', marginTop: 4 }}>
                              <Image
                                source={require('../assets/images/game/chest_1.png')}
                                style={{ width: 80, height: 80 }}
                                resizeMode="contain"
                              />
                              <Text style={[styles.pathRewardDesc, { marginTop: 4, fontWeight: 'bold', color: '#555' }]}>
                                Common Chest
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.pathRewardDesc}>
                              Earn 500 golden feathers
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Center Node */}
                      <View style={[styles.pathNode, pts <= 2 ? styles.pathNodeCompleted : styles.pathNodeLocked]}>
                        <Text style={styles.pathNodeIcon}>{pts <= 2 ? '✅' : '🔒'}</Text>
                      </View>

                      {/* Empty side for layout centering */}
                      <View style={styles.pathEmptySide} />
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        );
      case 2:
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.eggGrid}>
              <TouchableOpacity onPress={() => setSelectedEgg('white')} style={[styles.eggCard, selectedEgg === 'white' && styles.eggSelected]}>
                <View style={[styles.rarityBadge, styles.rarityBadgeCommon]}>
                  <Text style={styles.rarityBadgeText}>COMMON</Text>
                </View>
                <Image source={require('../assets/images/game/white_egg.png')} style={styles.eggImage} resizeMode="contain" />
                {selectedEgg === 'white' && <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>Equipped</Text></View>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSelectedEgg('brown')} style={[styles.eggCard, selectedEgg === 'brown' && styles.eggSelected]}>
                <View style={[styles.rarityBadge, styles.rarityBadgeCommon]}>
                  <Text style={styles.rarityBadgeText}>COMMON</Text>
                </View>
                <Image source={require('../assets/images/game/brown_egg.png')} style={styles.eggImage} resizeMode="contain" />
                {selectedEgg === 'brown' && <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>Equipped</Text></View>}
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!globalUnlockedEggs.has('rare1')}
                onPress={() => setSelectedEgg('rare1')}
                style={[styles.eggCard, !globalUnlockedEggs.has('rare1') && styles.eggBlocked, selectedEgg === 'rare1' && styles.eggSelected]}
              >
                <View style={[styles.rarityBadge, styles.rarityBadgeRare]}>
                  <Text style={styles.rarityBadgeText}>RARE</Text>
                </View>
                {globalUnlockedEggs.has('rare1') && <View style={styles.rareGlow} />}
                <Image source={require('../assets/images/game/modified_egg_n1.png')} style={styles.eggImage} resizeMode="contain" />
                {!globalUnlockedEggs.has('rare1') ? (
                  <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>🔒 Locked</Text></View>
                ) : selectedEgg === 'rare1' && (
                  <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>Equipped</Text></View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!globalUnlockedEggs.has('rare2')}
                onPress={() => setSelectedEgg('rare2')}
                style={[styles.eggCard, !globalUnlockedEggs.has('rare2') && styles.eggBlocked, selectedEgg === 'rare2' && styles.eggSelected]}
              >
                <View style={[styles.rarityBadge, styles.rarityBadgeRare]}>
                  <Text style={styles.rarityBadgeText}>RARE</Text>
                </View>
                {globalUnlockedEggs.has('rare2') && <View style={styles.rareGlow} />}
                <Image source={require('../assets/images/game/modified_egg_n2.png')} style={styles.eggImage} resizeMode="contain" />
                {!globalUnlockedEggs.has('rare2') ? (
                  <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>🔒 Locked</Text></View>
                ) : selectedEgg === 'rare2' && (
                  <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>Equipped</Text></View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!globalUnlockedEggs.has('rare3')}
                onPress={() => setSelectedEgg('rare3')}
                style={[styles.eggCard, !globalUnlockedEggs.has('rare3') && styles.eggBlocked, selectedEgg === 'rare3' && styles.eggSelected]}
              >
                <View style={[styles.rarityBadge, styles.rarityBadgeLegendary]}>
                  <Text style={styles.rarityBadgeText}>LEGENDARY</Text>
                </View>
                {globalUnlockedEggs.has('rare3') && <View style={styles.legendaryGlow} />}
                <Image source={require('../assets/images/game/modified_egg_n3.png')} style={styles.eggImage} resizeMode="contain" />
                {!globalUnlockedEggs.has('rare3') ? (
                  <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>🔒 Locked</Text></View>
                ) : selectedEgg === 'rare3' && (
                  <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>Equipped</Text></View>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        );
      case 3:
        const sortedItems = [...SHOP_ITEMS].sort((a, b) => a.price - b.price);
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.pointsBanner}>
              <Text style={styles.pointsBannerLabel}>Golden Feathers</Text>
              <View style={styles.pointsBannerValueContainer}>
                <Image source={require('../assets/images/game/golden_feather.png')} style={styles.featherIcon} resizeMode="contain" />
                <Text style={styles.pointsBannerValue}>{points}</Text>
              </View>
            </View>

            <View style={styles.shopList}>
              {sortedItems.map((item) => (
                <View key={item.id} style={styles.shopItem}>
                  <View style={styles.shopItemIcon}><Text style={{ fontSize: 24 }}>{item.icon}</Text></View>
                  <View style={styles.shopItemDetails}>
                    <Text style={styles.shopItemTitle}>{item.title}</Text>
                    <Text style={styles.shopItemDesc}>{item.desc}</Text>
                  </View>
                  <TouchableOpacity disabled={item.disabled} style={[styles.buyButton, item.disabled && styles.buyButtonDisabled]}>
                    <Text style={styles.buyButtonText}>{item.price}{'\n'}golden feathers</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        );
      case 4:
        const mockLocalLeaderboard = [
          { id: 'l1', name: 'Nowak', wins: 15, avatar: require('../assets/images/game/modified_egg_n3.png'), isMe: false },
          { id: 'l2', name: 'Kowalski', wins: 12, avatar: require('../assets/images/game/brown_egg.png'), isMe: false },
          { id: 'l3', name: 'Wiśniewski', wins: 8, avatar: require('../assets/images/game/white_egg.png'), isMe: false },
          { id: 'l4', name: 'Wójcik', wins: 5, avatar: require('../assets/images/game/modified_egg_n2.png'), isMe: false },
          { id: 'l5', name: 'You', wins: 2, avatar: selectedEgg === 'rare1' ? require('../assets/images/game/modified_egg_n1.png') : selectedEgg === 'rare2' ? require('../assets/images/game/modified_egg_n2.png') : selectedEgg === 'rare3' ? require('../assets/images/game/modified_egg_n3.png') : selectedEgg === 'white' ? require('../assets/images/game/white_egg.png') : require('../assets/images/game/brown_egg.png'), isMe: true },
          { id: 'l6', name: 'Kamiński', wins: 1, avatar: require('../assets/images/game/brown_egg.png'), isMe: false },
        ];

        const mockGlobalLeaderboard = [
          { id: 'g1', rank: 1, name: 'Lewandowski', wins: 871, avatar: require('../assets/images/game/modified_egg_n3.png') },
          { id: 'g2', rank: 2, name: 'Zieliński', wins: 750, avatar: require('../assets/images/game/modified_egg_n2.png') },
          { id: 'g3', rank: 3, name: 'Szczęsny', wins: 500, avatar: require('../assets/images/game/brown_egg.png') },
          { id: 'g4', rank: 4, name: 'Milik', wins: 320, avatar: require('../assets/images/game/white_egg.png') },
          { id: 'g5', rank: 5, name: 'Glik', wins: 210, avatar: require('../assets/images/game/modified_egg_n1.png') },
          { id: 'g6', rank: 6, name: 'Krychowiak', wins: 120, avatar: require('../assets/images/game/brown_egg.png') },
        ];

        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.leaderboardHeaderBanner}>
              <View>
                <Text style={styles.pointsBannerLabel}>Your Game ID</Text>
                <Text style={styles.pointsBannerValueSmall}>#849201</Text>
              </View>
              <TouchableOpacity style={styles.globalAddFriendBtn}>
                <Text style={styles.globalAddFriendBtnText}>+ Add Friend</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.leaderboardToggleContainer}>
              <TouchableOpacity
                onPress={() => setLeaderboardScope('local')}
                style={[styles.leaderboardTab, leaderboardScope === 'local' && styles.leaderboardTabActive]}
              >
                <Text style={[styles.leaderboardTabText, leaderboardScope === 'local' && styles.leaderboardTabTextActive]}>Local</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLeaderboardScope('global')}
                style={[styles.leaderboardTab, leaderboardScope === 'global' && styles.leaderboardTabActive]}
              >
                <Text style={[styles.leaderboardTabText, leaderboardScope === 'global' && styles.leaderboardTabTextActive]}>Global</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.leaderboardList}>
              {leaderboardScope === 'local' ? (
                mockLocalLeaderboard.map((user, index) => (
                  <View key={user.id} style={[styles.leaderboardItem, user.isMe && styles.leaderboardItemMe]}>
                    <View style={styles.lbRank}><Text style={styles.lbRankText}>{index + 1}</Text></View>
                    <Image source={user.avatar} style={styles.lbAvatarLarge} resizeMode="contain" />
                    <View style={styles.lbDetails}>
                      <Text style={styles.lbName}>{user.name}</Text>
                      <Text style={styles.lbWins}>{user.wins} Wins</Text>
                    </View>
                  </View>
                ))
              ) : (
                <>
                  {mockGlobalLeaderboard.map((user) => (
                    <View key={user.id} style={styles.leaderboardItem}>
                      <View style={styles.lbRank}><Text style={styles.lbRankText}>{user.rank}</Text></View>
                      <Image source={user.avatar} style={styles.lbAvatarLarge} resizeMode="contain" />
                      <View style={styles.lbDetails}>
                        <Text style={styles.lbName}>{user.name}</Text>
                        <Text style={styles.lbWins}>{user.wins} Wins</Text>
                      </View>
                    </View>
                  ))}

                  {/* Divider for user rank */}
                  <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12, marginHorizontal: 20 }} />

                  {/* User's Global Rank */}
                  <View style={[styles.leaderboardItem, styles.leaderboardItemMe]}>
                    <View style={styles.lbRank}><Text style={styles.lbRankText}>29232</Text></View>
                    <Image
                        source={selectedEgg === 'rare1' ? require('../assets/images/game/modified_egg_n1.png') : selectedEgg === 'rare2' ? require('../assets/images/game/modified_egg_n2.png') : selectedEgg === 'rare3' ? require('../assets/images/game/modified_egg_n3.png') : selectedEgg === 'white' ? require('../assets/images/game/white_egg.png') : require('../assets/images/game/brown_egg.png')}
                      style={styles.lbAvatarLarge}
                      resizeMode="contain"
                    />
                    <View style={styles.lbDetails}>
                      <Text style={styles.lbName}>You</Text>
                      <Text style={styles.lbWins}>2 Wins</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.topLogo}>Egg Clash</Text>
        {activeTab === 1 ? (
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpText}>How to play?</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} /> /* placeholder to center title safely */
        )}
      </View>

      <View style={styles.container}>
        {renderTabContent()}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => setActiveTab(1)} style={styles.navItem}>
          <Text style={{ fontSize: 22 }}>{activeTab === 1 ? '🎮' : '🕹️'}</Text>
          <Text style={[styles.navText, activeTab === 1 && styles.navTextActive]}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab(2)} style={styles.navItem}>
          <Text style={{ fontSize: 22 }}>{activeTab === 2 ? '🥚' : '🥚'}</Text>
          <Text style={[styles.navText, activeTab === 2 && styles.navTextActive]}>Eggs</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab(3)} style={styles.navItem}>
          <Text style={{ fontSize: 22 }}>{activeTab === 3 ? '🛍️' : '🛒'}</Text>
          <Text style={[styles.navText, activeTab === 3 && styles.navTextActive]}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab(4)} style={styles.navItem}>
          <Text style={{ fontSize: 22 }}>{activeTab === 4 ? '🏆' : '🏅'}</Text>
          <Text style={[styles.navText, activeTab === 4 && styles.navTextActive]}>Ranks</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isSearching}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSearching(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.matchmakingContainer}>
            <ActivityIndicator size="large" color="#d11241" style={{ marginBottom: 20 }} />
            <Text style={styles.matchmakingTitle}>Looking for opponents ...</Text>
            <Text style={styles.matchmakingSubtitle}>
              Your friend has to open Egg Clash and click Find opponent. Then, you need to stand next to each other and shake your phones. You will be connected and the battle will begin!
            </Text>
            <TouchableOpacity
              style={styles.cancelSearchButton}
              onPress={() => setIsSearching(false)}
            >
              <Text style={styles.cancelSearchButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showChestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.matchmakingContainer, { padding: 40 }]}>
            {chestOpened ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🎉</Text>
                <Text style={[styles.matchmakingTitle, { color: '#00e676' }]}>Congratulations!</Text>
                <Text style={styles.matchmakingSubtitle}>
                  You found a {newEggReceived === 'rare3' ? 'legendary' : 'rare'} egg in the chest!
                </Text>

                <AnimatedRN.View style={[{ alignItems: 'center', marginBottom: 30 }, eggAnimatedStyle]}>
                  {newEggReceived === 'rare3' ? (
                    <View style={[styles.legendaryGlow, { top: '0%' }]} />
                  ) : (
                    <View style={[styles.rareGlow, { top: '0%' }]} />
                  )}
                  <Image
                    source={newEggReceived === 'rare1' ? require('../assets/images/game/modified_egg_n1.png') : newEggReceived === 'rare2' ? require('../assets/images/game/modified_egg_n2.png') : require('../assets/images/game/modified_egg_n3.png')}
                    style={{ width: 120, height: 160 }}
                    resizeMode="contain"
                  />
                </AnimatedRN.View>

                <TouchableOpacity style={[styles.playButton, { width: '100%' }]} onPress={handleCloseChest}>
                  <Text style={styles.playButtonText}>Awesome!</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.matchmakingTitle}>You Won a Chest!</Text>
                <Text style={styles.matchmakingSubtitle}>Tap the chest to open it and see your reward.</Text>

                <TouchableOpacity onPress={handleOpenChest}>
                  <Image
                    source={require('../assets/images/game/chest_1.png')}
                    style={{ width: 280, height: 280, marginBottom: 20 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelSearchButton} onPress={() => setShowChestModal(false)}>
                  <Text style={styles.cancelSearchButtonText}>Open Later</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#eee',
    ...(Platform.OS === 'android' ? { paddingTop: 40 } : {}),
  },
  backButton: { width: 80 },
  backText: { color: '#0b1c4c', fontWeight: 'bold', fontSize: 16 },
  topLogo: { color: '#111', fontWeight: '900', fontSize: 20 },
  helpButton: { width: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', paddingVertical: 6, borderRadius: 12 },
  helpText: { color: '#0b1c4c', fontSize: 11, fontWeight: 'bold' },

  container: { flex: 1, backgroundColor: '#f2f4f7' },
  tabContent: { flex: 1 },

  // Tab 1: Play
  mainPlaySection: { backgroundColor: '#fff', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  eggDisplayContainer: { width: 280, height: 360, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  bigEggImage: { width: 280, height: 360, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  playButton: { backgroundColor: '#d11241', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30, shadowColor: '#d11241', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  playButtonText: { color: 'white', fontWeight: '900', fontSize: 20, letterSpacing: 1 },

  rewardsSection: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0b1c4c', marginBottom: 24, textAlign: 'center' },
  rewardsScroll: { position: 'relative' },
  pathCenterLine: { position: 'absolute', width: 4, backgroundColor: '#d11241', left: '50%', marginLeft: -2, top: 0, bottom: 0, opacity: 0.2 },
  pathRow: { width: '100%', alignItems: 'center', marginBottom: 24, paddingHorizontal: 10 },
  pathRowLeft: { flexDirection: 'row' },
  pathRowRight: { flexDirection: 'row-reverse' },
  pathCardContainer: { flex: 1 },
  pathCardContainerLeft: { alignItems: 'flex-end', paddingRight: 20 },
  pathCardContainerRight: { alignItems: 'flex-start', paddingLeft: 20 },
  pathRewardCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, width: 130, alignItems: 'center' },
  pathRewardTitle: { fontSize: 13, fontWeight: '800', color: '#333' },
  pathRewardDesc: { fontSize: 10, color: '#888', marginTop: 4, textAlign: 'center' },
  pathNode: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  pathNodeCompleted: { backgroundColor: '#d11241', shadowColor: '#d11241', shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  pathNodeLocked: { backgroundColor: '#ccc', borderWidth: 2, borderColor: '#fff' },
  pathNodeIcon: { fontSize: 12 },
  pathEmptySide: { flex: 1 },

  // Tab 2: Eggs
  eggGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' },
  eggCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  eggSelected: { borderColor: '#d11241', backgroundColor: '#fff5f7' },
  eggBlocked: { opacity: 0.6 },
  eggImage: { width: 160, height: 200, marginBottom: 10, zIndex: 1 },
  smallEgg: { fontSize: 30 },
  rarityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  rarityBadgeCommon: {
    backgroundColor: '#94a3b8',
  },
  rarityBadgeRare: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  rarityBadgeLegendary: {
    backgroundColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  rarityBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rareGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    top: '15%',
    zIndex: 0,
  },
  legendaryGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    top: '10%',
    zIndex: 0,
  },
  equippedBadge: { backgroundColor: '#d11241', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginTop: 6 },
  equippedBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  blockedBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginTop: 6 },
  blockedBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Tab 3: Shop
  pointsBanner: { backgroundColor: '#d11241', padding: 24, alignItems: 'center', marginBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  pointsBannerLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  pointsBannerValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featherIcon: { width: 108, height: 108 },
  pointsBannerValue: { color: 'white', fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  shopList: { paddingHorizontal: 16 },
  shopItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  shopItemIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  shopItemDetails: { flex: 1 },
  shopItemTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  shopItemDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  buyButton: { backgroundColor: '#0b1c4c', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  buyButtonDisabled: { backgroundColor: '#ccc' },
  buyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },

  // Tab 4: Leaderboards
  leaderboardHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d11241',
    padding: 20,
    marginBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  globalAddFriendBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  globalAddFriendBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13
  },
  pointsBannerValueSmall: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900'
  },
  leaderboardToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 14,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  leaderboardTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  leaderboardTabActive: {
    backgroundColor: '#d11241',
    shadowColor: '#d11241',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  leaderboardTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666'
  },
  leaderboardTabTextActive: {
    color: '#fff'
  },
  leaderboardList: { paddingHorizontal: 16 },
  leaderboardItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  leaderboardItemMe: { borderColor: '#d11241', borderWidth: 2 },
  lbRank: { width: 50, alignItems: 'center', marginRight: 8 },
  lbRankText: { fontSize: 14, fontWeight: '800', color: '#0b1c4c' },
  lbAvatarLarge: { width: 50, height: 65, marginRight: 16 },
  lbDetails: { flex: 1 },
  lbName: { fontSize: 17, fontWeight: '700', color: '#111' },
  lbWins: { fontSize: 13, color: '#d11241', fontWeight: 'bold', marginTop: 2 },

  // Bottom Nav
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 20 : 10, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '500' },
  navTextActive: { color: '#d11241', fontWeight: '800' },

  // Modal Matchmaking
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  matchmakingContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10
  },
  matchmakingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0b1c4c',
    marginBottom: 16,
    textAlign: 'center'
  },
  matchmakingSubtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30
  },
  cancelSearchButton: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%'
  },
  cancelSearchButtonText: {
    color: '#0b1c4c',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center'
  }
});
