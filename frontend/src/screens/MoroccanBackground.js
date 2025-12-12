import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // expo-vector-icons

const { width, height } = Dimensions.get('window');

// Liste de stickers foot (icônes)
const FOOTBALL_ICONS = [
  'football',
  'trophy',
  'whistle',
  'soccer-field',
  'account',
  'shield-check',
];

const FootballSticker = ({ style, iconName, color, size }) => (
  <Animated.View style={[styles.stickerContainer, style]}>
    <MaterialCommunityIcons name={iconName} size={size} color={color} />
  </Animated.View>
);

const MoroccanBackground = () => {
  const stickers = useRef(
    Array.from({ length: 15 }, () => {
      const initX = Math.random() * width;
      const randomIcon =
        FOOTBALL_ICONS[
          Math.floor(Math.random() * FOOTBALL_ICONS.length)
        ];
      const randomColor = '#D4AF37'; // doré
      const randomSize = 28 + Math.random() * 16; // 28–44

      return {
        translateY: useRef(
          new Animated.Value(Math.random() * height),
        ).current,
        swing: useRef(
          new Animated.Value(Math.random() * 2 - 1),
        ).current,
        scale: useRef(
          new Animated.Value(0.6 + Math.random() * 0.7),
        ).current,
        opacity: useRef(
          new Animated.Value(0.3 + Math.random() * 0.5),
        ).current,
        initX,
        iconName: randomIcon,
        color: randomColor,
        size: randomSize,
      };
    }),
  ).current;

  useEffect(() => {
    stickers.forEach((sticker, index) => {
      const duration = 15000 + Math.random() * 10000;
      const delay = index * 800;

      // Animation verticale (monte et respawn en bas)
      Animated.loop(
        Animated.sequence([
          Animated.timing(sticker.translateY, {
            toValue: -100,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(sticker.translateY, {
            toValue: height + 100,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Balancement horizontal
      Animated.loop(
        Animated.sequence([
          Animated.timing(sticker.swing, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(sticker.swing, {
            toValue: -1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {stickers.map((sticker, index) => (
        <FootballSticker
          key={index}
          iconName={sticker.iconName}
          color={sticker.color}
          size={sticker.size}
          style={{
            transform: [
              {
                translateX: sticker.swing.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [sticker.initX - 30, sticker.initX + 30],
                }),
              },
              { translateY: sticker.translateY },
              { scale: sticker.scale },
            ],
            opacity: sticker.opacity,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  stickerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MoroccanBackground;
