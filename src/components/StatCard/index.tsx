import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  color?: 'copper' | 'blue' | 'green' | 'orange';
  subInfo?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  unit,
  color = 'copper',
  subInfo,
  trend,
  trendValue
}) => {
  return (
    <View className={styles.card}>
      <View className={classnames(styles.iconWrap, styles[color])}>
        <Text>{icon}</Text>
      </View>
      <View className={styles.label}>{label}</View>
      <View>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      {(subInfo || trendValue) && (
        <View className={styles.subInfo}>
          {subInfo && <Text>{subInfo}</Text>}
          {trendValue && (
            <Text className={trend === 'up' ? styles.trendUp : styles.trendDown}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default StatCard;
