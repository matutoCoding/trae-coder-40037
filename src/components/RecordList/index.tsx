import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';

export interface ListItem {
  id: string;
  batchNo: string;
  time: string;
  operator: string;
  data: Array<{ label: string; value: string | number }>;
  statusType?: 'pass' | 'fail' | 'pending' | 'running' | 'warning';
  statusText?: string;
}

interface RecordListProps {
  records: ListItem[];
  emptyText?: string;
  onItemClick?: (id: string) => void;
}

const RecordList: React.FC<RecordListProps> = ({
  records,
  emptyText = '暂无记录',
  onItemClick
}) => {
  if (!records || records.length === 0) {
    return (
      <View className={styles.listContainer}>
        <View className={styles.empty}>{emptyText}</View>
      </View>
    );
  }

  return (
    <View className={styles.listContainer}>
      {records.map((item) => (
        <View
          className={styles.listItem}
          key={item.id}
          onClick={() => onItemClick && onItemClick(item.id)}
        >
          <View className={styles.itemHeader}>
            <Text className={styles.batchNo}>{item.batchNo}</Text>
            {item.statusType && item.statusText && (
              <StatusBadge type={item.statusType} text={item.statusText} />
            )}
          </View>
          <View className={styles.itemData}>
            {item.data.map((d, idx) => (
              <View className={styles.dataCol} key={idx}>
                <Text className={styles.dataLabel}>{d.label}</Text>
                <Text className={styles.dataValue}>{d.value}</Text>
              </View>
            ))}
          </View>
          <View className={styles.itemFooter}>
            <Text className={styles.operator}>操作人: {item.operator}</Text>
            <Text className={styles.time}>{item.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default RecordList;
