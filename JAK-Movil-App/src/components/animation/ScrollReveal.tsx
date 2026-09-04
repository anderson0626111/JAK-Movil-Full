import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScrollReveal({
  children,
  delay = 0,
  distance = 34,
  style,
}: ScrollRevealProps) {
  const elementRef = useRef<any>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const reveal = () => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 560,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    };

    if (
      Platform.OS === 'web' &&
      typeof IntersectionObserver !== 'undefined' &&
      elementRef.current
    ) {
      const candidate = elementRef.current;
      const element =
        candidate instanceof Element ? candidate : candidate?.getNode?.();

      if (element instanceof Element) {
        observer = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            reveal();
            observer?.disconnect();
          },
          {
            threshold: 0.08,
            rootMargin: '0px 0px -7% 0px',
          }
        );
        observer.observe(element);
      } else {
        fallbackTimer = setTimeout(reveal, 30);
      }
    } else {
      fallbackTimer = setTimeout(reveal, 30);
    }

    return () => {
      observer?.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      progress.stopAnimation();
    };
  }, [delay, progress]);

  return (
    <Animated.View
      ref={elementRef}
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
