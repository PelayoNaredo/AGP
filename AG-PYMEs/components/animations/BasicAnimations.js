// BasicAnimations.js - Animaciones básicas y reutilizables
import React, { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
} from "react-native-reanimated";

// ===== BOUNCE ANIMATION =====
export const BounceAnimation = ({
  children,
  onPress,
  scaleDown = 0.95,
  scaleUp = 1.05,
  duration = 150,
  disabled = false,
  style = {},
  ...pressableProps
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(scaleDown, { duration });
      opacity.value = withTiming(0.8, { duration });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSequence(
        withTiming(scaleUp, { duration: duration / 2 }),
        withSpring(1)
      );
      opacity.value = withTiming(1, { duration });
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      // Animación de confirmación
      scale.value = withSequence(
        withTiming(scaleDown * 0.9, { duration: 50 }),
        withSpring(1)
      );
      onPress();
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={style}
      {...pressableProps}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

// ===== PULSE ANIMATION =====
export const PulseAnimation = ({
  children,
  isActive = true,
  duration = 1000,
  scale = 1.1,
  opacity = 0.7,
  style = {},
  color = "#FF6B6B",
}) => {
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 2 }),
          withTiming(0, { duration: duration / 2 })
        ),
        -1,
        false
      );
    } else {
      pulseAnimation.value = withTiming(0, { duration: 200 });
    }
  }, [isActive, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(pulseAnimation.value, [0, 1], [1, scale]);

    const opacityValue = interpolate(
      pulseAnimation.value,
      [0, 1],
      [1, opacity]
    );

    return {
      transform: [{ scale: scaleValue }],
      opacity: opacityValue,
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

// ===== SHAKE ANIMATION =====
export const ShakeAnimation = ({
  children,
  isActive = false,
  intensity = 5,
  duration = 500,
  style = {},
}) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(-intensity, { duration: duration / 8 }),
          withTiming(intensity, { duration: duration / 4 }),
          withTiming(-intensity, { duration: duration / 4 }),
          withTiming(intensity, { duration: duration / 4 }),
          withTiming(0, { duration: duration / 8 })
        ),
        1,
        false
      );
    }
  }, [isActive, intensity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

// ===== FADE ANIMATION =====
export const FadeAnimation = ({
  children,
  visible = true,
  duration = 300,
  style = {},
}) => {
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration });
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

// ===== SCALE ANIMATION =====
export const ScaleAnimation = ({
  children,
  visible = true,
  duration = 300,
  fromScale = 0,
  toScale = 1,
  style = {},
}) => {
  const scale = useSharedValue(visible ? toScale : fromScale);

  useEffect(() => {
    scale.value = withSpring(visible ? toScale : fromScale, {
      damping: 15,
      stiffness: 120,
    });
  }, [visible, fromScale, toScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

// ===== SLIDE ANIMATION =====
export const SlideAnimation = ({
  children,
  visible = true,
  direction = "right", // 'left', 'right', 'up', 'down'
  distance = 100,
  duration = 300,
  style = {},
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const getInitialTransform = () => {
      switch (direction) {
        case "left":
          return { x: -distance, y: 0 };
        case "right":
          return { x: distance, y: 0 };
        case "up":
          return { x: 0, y: -distance };
        case "down":
          return { x: 0, y: distance };
        default:
          return { x: distance, y: 0 };
      }
    };

    const initial = getInitialTransform();

    translateX.value = withTiming(visible ? 0 : initial.x, { duration });
    translateY.value = withTiming(visible ? 0 : initial.y, { duration });
  }, [visible, direction, distance, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};
