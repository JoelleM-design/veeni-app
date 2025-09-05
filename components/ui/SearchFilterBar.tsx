import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchFilterBarProps {
  value: string;
  onChange: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
  filterActive?: boolean;
  children?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  value,
  onChange,
  onFilterPress,
  placeholder = 'Rechercher...',
  filterActive = false,
  children,
}) => (
  <View style={styles.stickySearchRow}>
    <View style={styles.searchRow}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#B0B0B0"
          value={value}
          onChangeText={onChange}
        />
      </View>
      <TouchableOpacity style={[styles.filterBtn, filterActive && styles.filterBtnActive]} onPress={onFilterPress}>
        <Ionicons name="filter" size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  stickySearchRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  filterBtn: {
    marginLeft: 12,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#393C40', borderWidth: 0,
  },
}); 