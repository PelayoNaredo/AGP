// Animation Components Index - Centralized exports for all animation components
// This file provides easy access to all animation components and utilities

// Enhanced Animations (Main animation library)
export {
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
} from "./enhancedAnimations";

// Animated Components (Consolidated)
export {
  AnimatedButton,
  AnimatedCard,
  AnimatedLoading,
  AnimatedModal,
} from "./AnimatedComponents";

// Individual Components
export { default as AnimatedScreenWrapper } from "./AnimatedScreenWrapper";

// Basic Animations (Consolidated)
export {
  BounceAnimation,
  PulseAnimation,
  ShakeAnimation,
  FadeAnimation,
  ScaleAnimation,
  SlideAnimation,
} from "./BasicAnimations";

// UI Animations (Consolidated)
export { FeedbackAnimation, ProgressAnimation } from "./UIAnimations";

// Re-export enhanced animations as default for backward compatibility
export { default } from "./enhancedAnimations";
