import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  extra?: string;
  onExtraClick?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, extra, onExtraClick }) => {
  return (
    <View className={styles.header}>
      <View className={styles.title}>
        <View className={styles.bar}></View>
        <Text>{title}</Text>
      </View>
      {extra && (
        <Text className={styles.extra} onClick={onExtraClick}>
          {extra}
        </Text>
      )}
    </View>
  );
};

export default SectionHeader;
