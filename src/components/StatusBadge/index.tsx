import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatusBadgeProps {
  type: 'running' | 'warning' | 'stopped' | 'standby' | 'pass' | 'fail' | 'pending';
  text: string;
  showDot?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, text, showDot = true }) => {
  return (
    <View className={classnames(styles.badge, styles[type])}>
      {showDot && <View className={styles.dot}></View>}
      <Text>{text}</Text>
    </View>
  );
};

export default StatusBadge;
