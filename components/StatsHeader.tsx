import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatsBar } from './StatsBar';

interface StatsHeaderProps {
  avatarUri?: string;
  name?: string;
  subtitle?: string;
  stats: {
    red: number;
    white: number;
    rose: number;
    sparkling: number;
    total: number;
  };
  totalLabel: string;
  children?: React.ReactNode;
  showAvatar?: boolean;
  spacing?: number;
  onAvatarPress?: () => void;
  avatarIcon?: React.ReactNode;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  avatarUri,
  name,
  subtitle,
  stats,
  totalLabel,
  children,
  showAvatar = true,
  spacing = 24,
  onAvatarPress,
  avatarIcon,
}) => {
  return (
    <View style={styles.headerContainer}>
      {showAvatar && (
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7} style={{alignSelf: 'center'}}>
          <View style={{position: 'relative', justifyContent: 'center', alignItems: 'center'}}>
            {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                {name && (
                  <Text style={styles.avatarInitial}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            )}
            {avatarIcon && (
              <View style={styles.avatarIconContainer}>
                {avatarIcon}
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
      {name && <Text style={styles.name}>{name}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <StatsBar values={stats} totalLabel={totalLabel} />
      <View style={{ height: spacing }} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 2,
    elevation: 2,
  },
  name: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
    marginTop: 16,
  },
  subtitle: {
    color: '#B0B0B0',
    fontSize: 16,
    marginBottom: 16,
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 