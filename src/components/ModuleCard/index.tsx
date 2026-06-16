import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import type { ModuleStatus } from '@/types';
import { statusNameMap } from '@/data/mockData';

interface ModuleCardProps {
  data: ModuleStatus;
  onClick?: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ data, onClick }) => {
  const status = statusNameMap[data.status];
  const pageMap: Record<string, string> = {
    feeding: '/pages/feeding-detail/index',
    melting: '/pages/melting-detail/index',
    furnace: '/pages/furnace-detail/index',
    casting: '/pages/casting-detail/index',
    rolling: '/pages/rolling-detail/index',
    pickling: '/pages/pickling-detail/index',
    inspection: '/pages/inspection-detail/index'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const pagePath = pageMap[data.key];
      if (pagePath) {
        console.log('[ModuleCard] 跳转到详情页:', pagePath);
        Taro.navigateTo({
          url: `${pagePath}?moduleKey=${data.key}`
        });
      }
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.name}>{data.name}</Text>
        <StatusBadge type={data.status} text={status.text} />
      </View>
      <Text className={styles.desc}>{data.description}</Text>
      <View className={styles.dataRow}>
        <View className={styles.dataItem}>
          <Text className={styles.dataLabel}>当前值</Text>
          <Text className={styles.dataValue}>
            {data.currentValue}
            <Text className={styles.unit}>{data.unit}</Text>
          </Text>
        </View>
        <View className={styles.dataItem}>
          <Text className={styles.dataLabel}>目标值</Text>
          <Text className={styles.targetValue}>
            <Text className={styles.label}>目标:</Text>
            {data.targetValue} {data.unit}
          </Text>
        </View>
      </View>
      <View className={styles.footer}>
        <Text className={styles.time}>更新: {data.updateTime.slice(-8)}</Text>
        <Text className={styles.arrow}>查看详情 →</Text>
      </View>
    </View>
  );
};

export default ModuleCard;
