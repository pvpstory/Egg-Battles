import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const handleEggClick = () => {
    router.push('/game');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileContainer}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>AN</Text>
              <View style={styles.avatarBadge}><Text style={styles.avatarBadgeText}>👤</Text></View>
            </View>
            <Text style={styles.dropdownArrow}> ⌄ </Text>
          </View>
          
          <View style={styles.topRight}>
            <TouchableOpacity><Text style={styles.topIcon}>🔍</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.topIcon}>🔔</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.topIcon}>📶</Text></TouchableOpacity>
            {/* The Egg Symbol */}
            <TouchableOpacity onPress={handleEggClick} style={styles.eggContainer}>
              <Image source={require('../../assets/images/game/logo_egg.png')} style={styles.logoEgg} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Main Account Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderArea}>
              <View style={styles.bankChip}>
                <Text style={styles.bankChipText}>PKO Bank Polski</Text>
              </View>
              <View style={styles.cardHeaderIcons}>
                <TouchableOpacity><Text style={styles.eyeIcon}>👁️</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.dotsIcon}>⋮</Text></TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.accountRow}>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>Konto za Zero</Text>
                <Text style={styles.accountNumber}>55 (...) 0344 6317</Text>
              </View>
              <View style={styles.balanceDetails}>
                <Text style={styles.balanceLabel}>Dostępna kwota</Text>
                <Text style={styles.balanceAmount}>2 000,00 <Text style={styles.currency}>PLN</Text></Text>
              </View>
            </View>

            <Text style={styles.limitText}>w tym limit odnawialny: 1 500,00 PLN</Text>
            
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Historia</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>Przelew</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dotEmpty} />
            <View style={styles.dotEmpty} />
            <View style={styles.dotEmpty} />
          </View>

          {/* Codzienne Section */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Codzienne</Text>
              <TouchableOpacity><Text style={styles.dotsIcon}>⋮</Text></TouchableOpacity>
            </View>
            
            <View style={styles.gridContainer}>
              <TouchableOpacity style={styles.gridItem}>
                <View style={[styles.gridIconBox, {backgroundColor: '#333'}]}>
                  <Text style={styles.blikLogoWhite}>blik</Text>
                </View>
                <Text style={styles.gridItemText}>Kod{'\n'}BLIK</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItem}>
                <View style={styles.gridIconBox}>
                  <Text style={styles.genericIcon}>📱</Text>
                </View>
                <Text style={styles.gridItemText}>Przelew{'\n'}na telefon</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItem}>
                <View style={styles.gridIconBox}>
                  <Text style={styles.genericIcon}>🎫</Text>
                </View>
                <Text style={styles.gridItemText}>Bilet{'\n'}komunikacji</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItem}>
                <View style={styles.gridIconBox}>
                  <Text style={styles.genericIcon}>🅿️</Text>
                </View>
                <Text style={styles.gridItemText}>Opłaty{'\n'}parkingowe</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Karty Section */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Karty</Text>
              <TouchableOpacity><Text style={styles.dotsIcon}>⋮</Text></TouchableOpacity>
            </View>
          </View>
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f4f7' },
  mobileContainer: { flex: 1, backgroundColor: '#f2f4f7' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    ...(Platform.OS === 'android' ? { paddingTop: 40 } : {}),
  },
  topLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f5',
    justifyContent: 'center', alignItems: 'center', position: 'relative'
  },
  avatarText: { fontSize: 13, color: '#0b1c4c', fontWeight: 'bold' },
  avatarBadge: {
    position: 'absolute', bottom: -4, right: -4, backgroundColor: '#0b1c4c',
    width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center'
  },
  avatarBadgeText: { fontSize: 10, color: 'white' },
  dropdownArrow: { fontSize: 24, paddingLeft: 8, color: '#0b1c4c', paddingBottom: 8 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  topIcon: { fontSize: 20, color: '#0b1c4c' },
  eggContainer: { 
  },
  logoEgg: { width: 60, height: 60, resizeMode: 'contain' },
  
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardHeaderArea: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bankChip: { backgroundColor: '#f0f2f5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  bankChipText: { fontSize: 12, color: '#333' },
  cardHeaderIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  eyeIcon: { fontSize: 16, color: '#0b1c4c' },
  dotsIcon: { fontSize: 18, color: '#0b1c4c', fontWeight: 'bold' },
  
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  accountDetails: { flex: 1 },
  accountName: { fontSize: 18, color: '#111', fontWeight: '500' },
  accountNumber: { fontSize: 13, color: '#888', marginTop: 4 },
  balanceDetails: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 12, color: '#888' },
  balanceAmount: { fontSize: 22, color: '#111', fontWeight: '400', marginTop: 2 },
  currency: { fontSize: 14 },
  
  limitText: { textAlign: 'right', fontSize: 11, color: '#999', marginBottom: 16 },
  
  actionRow: { flexDirection: 'row', gap: 12 },
  btnSecondary: { flex: 1, backgroundColor: '#f0f2f5', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnSecondaryText: { color: '#0b1c4c', fontWeight: '500', fontSize: 15 },
  btnPrimary: { flex: 1, backgroundColor: '#003380', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '500', fontSize: 15 },
  
  paginationDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#003380' },
  dotEmpty: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, color: '#111', fontWeight: '500' },
  
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { alignItems: 'center', width: '22%' },
  gridIconBox: { width: 50, height: 50, backgroundColor: '#f0f2f5', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  blikLogoWhite: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  genericIcon: { fontSize: 20 },
  gridItemText: { textAlign: 'center', fontSize: 11, color: '#333' }
});
