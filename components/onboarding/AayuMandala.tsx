import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Polygon,
  G,
  Defs,
  RadialGradient,
  Stop,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
} from 'react-native-svg';

interface AayuMandalaProps {
  size?: number;
  color?: string;
  animated?: boolean;
  glow?: boolean;
  opacity?: number;
  style?: ViewStyle;
}

export const AayuMandala: React.FC<AayuMandalaProps> = ({
  size = 120,
  color = '#c8872a',
  animated: shouldAnimate = true,
  glow = true,
  opacity = 1,
  style,
}) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (shouldAnimate) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 30000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.4,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 3500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.94,
            duration: 3500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [shouldAnimate]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cx = size / 2;
  const cy = size / 2;
  const s = size / 200;

  function petalPath(outerR: number, innerR: number, width: number, angleDeg: number): string {
    const a = (angleDeg * Math.PI) / 180;
    const tip = { x: cx + outerR * Math.sin(a), y: cy - outerR * Math.cos(a) };
    const base = { x: cx + innerR * Math.sin(a), y: cy - innerR * Math.cos(a) };
    const perp = { x: Math.cos(a) * width, y: Math.sin(a) * width };

    const ctrl1L = {
      x: cx + outerR * 0.72 * Math.sin(a) - perp.x,
      y: cy - outerR * 0.72 * Math.cos(a) - perp.y,
    };
    const ctrl2L = {
      x: cx + innerR * 1.28 * Math.sin(a) - perp.x,
      y: cy - innerR * 1.28 * Math.cos(a) - perp.y,
    };
    const ctrl1R = {
      x: cx + outerR * 0.72 * Math.sin(a) + perp.x,
      y: cy - outerR * 0.72 * Math.cos(a) + perp.y,
    };
    const ctrl2R = {
      x: cx + innerR * 1.28 * Math.sin(a) + perp.x,
      y: cy - innerR * 1.28 * Math.cos(a) + perp.y,
    };

    return [
      `M ${tip.x} ${tip.y}`,
      `C ${ctrl1L.x} ${ctrl1L.y} ${ctrl2L.x} ${ctrl2L.y} ${base.x} ${base.y}`,
      `C ${ctrl2R.x} ${ctrl2R.y} ${ctrl1R.x} ${ctrl1R.y} ${tip.x} ${tip.y}`,
      'Z',
    ].join(' ');
  }

  const outerPetals = [0, 45, 90, 135, 180, 225, 270, 315].map((a) =>
    petalPath(84 * s, 28 * s, 22 * s, a)
  );
  const innerPetals = [0, 45, 90, 135, 180, 225, 270, 315].map((a) =>
    petalPath(58 * s, 20 * s, 15 * s, a)
  );

  const dSize = 11 * s;
  const diamond = [
    `${cx},${cy - dSize}`,
    `${cx + dSize * 0.72},${cy}`,
    `${cx},${cy + dSize}`,
    `${cx - dSize * 0.72},${cy}`,
  ].join(' ');

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          opacity,
          transform: [
            { rotate: shouldAnimate ? spin : '0deg' },
            { scale: shouldAnimate ? scaleAnim : 1 },
          ],
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
          <Filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <FeGaussianBlur stdDeviation={2 * s} result="blur" />
            <FeMerge>
              <FeMergeNode in="blur" />
              <FeMergeNode in="SourceGraphic" />
            </FeMerge>
          </Filter>
        </Defs>

        {glow && (
          <Circle cx={cx} cy={cy} r={size * 0.45} fill="url(#centerGlow)" />
        )}

        <Circle
          cx={cx}
          cy={cy}
          r={90 * s}
          fill="none"
          stroke={color}
          strokeWidth={2 * s}
          strokeOpacity={0.25}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={96 * s}
          fill="none"
          stroke={color}
          strokeWidth={1 * s}
          strokeOpacity={0.12}
        />

        {outerPetals.map((d, i) => (
          <Path
            key={`op-${i}`}
            d={d}
            fill={color}
            fillOpacity={0.12}
            stroke={color}
            strokeWidth={1.8 * s}
            strokeOpacity={0.75}
            strokeLinejoin="round"
          />
        ))}

        {innerPetals.map((d, i) => (
          <Path
            key={`ip-${i}`}
            d={d}
            fill={color}
            fillOpacity={0.18}
            stroke={color}
            strokeWidth={1.4 * s}
            strokeOpacity={0.6}
            strokeLinejoin="round"
          />
        ))}

        <Circle
          cx={cx}
          cy={cy}
          r={24 * s}
          fill="none"
          stroke={color}
          strokeWidth={2.5 * s}
          strokeOpacity={0.7}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={18 * s}
          fill={color}
          fillOpacity={0.1}
          stroke={color}
          strokeWidth={1.5 * s}
          strokeOpacity={0.4}
        />

        <Polygon
          points={diamond}
          fill={color}
          fillOpacity={0.9}
          stroke={color}
          strokeWidth={1 * s}
          strokeOpacity={1}
          filter="url(#softGlow)"
        />
      </Svg>
    </Animated.View>
  );
};
