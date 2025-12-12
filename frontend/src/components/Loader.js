import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';

export default function Loader() {
  return (
    <View style={styles.container}>
      {/* Assurez-vous d'avoir le fichier json dans assets, sinon commentez le LottieView et décommentez l'ActivityIndicator */}
      <LottieView
        source={require('../../assets/loading-soccer.json')}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
      />
      {/* <ActivityIndicator size="large" color="#2ecc71" /> */}
      <Text style={styles.text}>Kaytsakhen... (Échauffement)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  text: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#555' }
});