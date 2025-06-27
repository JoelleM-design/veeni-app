import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

export default function BlurTabBarBackground() {
  const tabBarHeight = useBottomTabBarHeight();
  
  return (
    <View 
      style={[
        styles.container, 
        { height: tabBarHeight }
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
