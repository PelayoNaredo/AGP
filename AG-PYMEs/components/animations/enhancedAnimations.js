// Enhanced Animations with react-native-reanimated 3.17.4
import React from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  interpolate,
  Extrapolate,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';

// Configuraciones de timing optimizadas para diferentes tipos de animaciones
export const ANIMATION_CONFIGS = {
  // Para elementos que aparecen/desaparecen
  fade: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  
  // Para movimientos y transiciones de posición
  slide: {
    duration: 400,
    easing: Easing.out(Easing.ease),
  },
  
  // Para transformaciones de escala
  scale: {
    duration: 350,
    easing: Easing.out(Easing.back(1.5)),
  },
  
  // Para animaciones de spring más naturales
  spring: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },
  
  // Para animaciones de rebote suaves
  softSpring: {
    damping: 18,
    stiffness: 90,
    mass: 0.8,
  },
  
  // Para animaciones rápidas y responsivas
  quickSpring: {
    damping: 12,
    stiffness: 180,
    mass: 0.6,
  }
};

// Configuraciones adicionales de timing
export const TIMING_CONFIGS = {
  timing: {
    fast: {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    },
    medium: {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    },
    slow: {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    },
  },
  spring: {
    spring: {
      damping: 15,
      stiffness: 120,
      mass: 1,
    },
    softSpring: {
      damping: 18,
      stiffness: 90,
      mass: 0.8,
    },
    quickSpring: {
      damping: 12,
      stiffness: 180,
      mass: 0.6,
    },
  },
};

// Hook personalizado para animaciones de entrada mejoradas
export const useEnhancedEntrance = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);
  
  const animateIn = () => {
    opacity.value = withDelay(
      delay,
      withTiming(1, ANIMATION_CONFIGS.fade)
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, ANIMATION_CONFIGS.spring)
    );
    scale.value = withDelay(
      delay,
      withSpring(1, ANIMATION_CONFIGS.softSpring)
    );
  };
  
  const animateOut = (callback) => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-20, { duration: 200 });
    scale.value = withTiming(0.95, { duration: 200 }, () => {
      if (callback) runOnJS(callback)();
    });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));
  
  return { animateIn, animateOut, animatedStyle };
};

// Hook para animaciones de lista con stagger
export const useStaggeredListAnimation = (itemsCount, staggerDelay = 50) => {
  const animations = Array.from({ length: itemsCount }, () => ({
    opacity: useSharedValue(0),
    translateX: useSharedValue(-20),
  }));
  
  const animateItems = () => {
    animations.forEach((anim, index) => {
      anim.opacity.value = withDelay(
        index * staggerDelay,
        withTiming(1, ANIMATION_CONFIGS.fade)
      );
      anim.translateX.value = withDelay(
        index * staggerDelay,
        withSpring(0, ANIMATION_CONFIGS.spring)
      );
    });
  };
  
  const getItemStyle = (index) => useAnimatedStyle(() => ({
    opacity: animations[index]?.opacity.value || 0,
    transform: [{ translateX: animations[index]?.translateX.value || -20 }],
  }));
  
  return { animateItems, getItemStyle };
};

// Hook para efectos de hover/press mejorados
export const useInteractiveAnimation = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const pressIn = () => {
    scale.value = withSpring(0.95, ANIMATION_CONFIGS.quickSpring);
    opacity.value = withTiming(0.8, { duration: 100 });
  };
  
  const pressOut = () => {
    scale.value = withSpring(1, ANIMATION_CONFIGS.quickSpring);
    opacity.value = withTiming(1, { duration: 100 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return { pressIn, pressOut, animatedStyle };
};

// Hook para animaciones de carga con shimmer
export const useShimmerAnimation = () => {
  const shimmerTranslateX = useSharedValue(-100);
  
  const startShimmer = () => {
    shimmerTranslateX.value = withRepeat(
      withTiming(100, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  };
  
  const stopShimmer = () => {
    shimmerTranslateX.value = -100;
  };
  
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));
  
  return { startShimmer, stopShimmer, shimmerStyle };
};

// Hook para animaciones de éxito/error
export const useFeedbackAnimation = () => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const animateSuccess = () => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withSpring(1, ANIMATION_CONFIGS.spring)
    );
  };
  
  const animateError = () => {
    rotation.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));
  
  return { animateSuccess, animateError, animatedStyle };
};

// Hook para animaciones de progreso
export const useProgressAnimation = (duration = 1000) => {
  const progress = useSharedValue(0);
  
  const startProgress = () => {
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  };
  
  const resetProgress = () => {
    progress.value = 0;
  };
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  
  return { startProgress, resetProgress, progressStyle, progress };
};

// Componente Shimmer animado para estados de carga
export const ShimmerLoader = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style = {},
  shimmerColors = ['#E1E1E1', '#F5F5F5', '#E1E1E1']
}) => {
  const shimmerAnimation = useSharedValue(-1);

  React.useEffect(() => {
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerAnimation.value,
            [-1, 1],
            [-width, width],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View style={[
      { 
        width, 
        height, 
        backgroundColor: shimmerColors[0], 
        borderRadius,
        overflow: 'hidden'
      }, 
      style
    ]}>
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor: shimmerColors[1],
          },
          shimmerStyle,
        ]}
      />
    </View>
  );
};

// Componente para skeleton de cards
export const CardSkeleton = ({ 
  showAvatar = false, 
  showTitle = true, 
  showContent = true,
  linesCount = 3,
  style = {}
}) => {
  return (
    <View style={[{ padding: 16, backgroundColor: '#fff', borderRadius: 8 }, style]}>
      {showAvatar && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <ShimmerLoader width={40} height={40} borderRadius={20} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ShimmerLoader width="60%" height={16} style={{ marginBottom: 8 }} />
            <ShimmerLoader width="40%" height={12} />
          </View>
        </View>
      )}
      
      {showTitle && (
        <ShimmerLoader width="80%" height={20} style={{ marginBottom: 12 }} />
      )}
      
      {showContent && (
        <View>
          {Array.from({ length: linesCount }).map((_, index) => (
            <ShimmerLoader 
              key={index}
              width={index === linesCount - 1 ? "60%" : "100%"} 
              height={14} 
              style={{ marginBottom: 8 }} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Hook mejorado para shimmer con más opciones
export const useAdvancedShimmer = (isLoading = true, options = {}) => {
  const {
    duration = 1500,
    shimmerWidth = 100,
    colors = ['#E1E1E1', '#F5F5F5', '#E1E1E1']
  } = options;

  const shimmerAnimation = useSharedValue(-1);

  React.useEffect(() => {
    if (isLoading) {
      shimmerAnimation.value = withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      shimmerAnimation.value = -1;
    }
  }, [isLoading, duration]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerAnimation.value,
            [-1, 1],
            [-shimmerWidth, shimmerWidth],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: isLoading ? 1 : 0,
    };
  });

  return { shimmerStyle, isShimmering: isLoading };
};

// Componente de lista skeleton
export const ListSkeleton = ({ 
  itemCount = 5, 
  itemHeight = 80, 
  showAvatar = true,
  style = {}
}) => {
  return (
    <View style={style}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Animated.View
          key={index}
          entering={FadeInDown.delay(index * 100).duration(300)}
          style={{
            height: itemHeight,
            marginBottom: 12,
            backgroundColor: '#fff',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {showAvatar && (
            <ShimmerLoader 
              width={50} 
              height={50} 
              borderRadius={25} 
              style={{ marginRight: 12 }}
            />
          )}
          <View style={{ flex: 1 }}>
            <ShimmerLoader width="70%" height={16} style={{ marginBottom: 8 }} />
            <ShimmerLoader width="50%" height={12} style={{ marginBottom: 8 }} />
            <ShimmerLoader width="30%" height={12} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

export default {
  ANIMATION_CONFIGS,
  TIMING_CONFIGS,
  useEnhancedEntrance,
  useStaggeredListAnimation,
  useInteractiveAnimation,
  useShimmerAnimation,
  useFeedbackAnimation,
  useProgressAnimation,
  useAdvancedShimmer,
  ShimmerLoader,
  CardSkeleton,
  ListSkeleton,
};
