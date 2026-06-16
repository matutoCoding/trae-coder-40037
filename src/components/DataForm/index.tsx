import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

export interface FormItemData {
  label: string;
  value: string | number;
  highlight?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

interface DataFormProps {
  title?: string;
  items: FormItemData[];
  showActions?: boolean;
  primaryText?: string;
  secondaryText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

const DataForm: React.FC<DataFormProps> = ({
  title,
  items,
  showActions,
  primaryText = '提交记录',
  secondaryText = '查看历史',
  onPrimaryClick,
  onSecondaryClick
}) => {
  return (
    <View className={styles.formCard}>
      {title && (
        <View className={styles.formTitle}>
          <View className={styles.bar}></View>
          <Text>{title}</Text>
        </View>
      )}
      {items.map((item, index) => (
        <View className={styles.formItem} key={index}>
          <Text className={styles.label}>{item.label}</Text>
          <Text
            className={classnames(
              styles.value,
              item.highlight && styles.valueHighlight,
              item.variant === 'success' && styles.valueSuccess,
              item.variant === 'warning' && styles.valueWarning,
              item.variant === 'error' && styles.valueError
            )}
          >
            {item.value}
          </Text>
        </View>
      ))}
      {showActions && (
        <View className={styles.actionRow}>
          <Button className={styles.secondaryBtn} onClick={onSecondaryClick}>
            {secondaryText}
          </Button>
          <Button className={styles.primaryBtn} onClick={onPrimaryClick}>
            {primaryText}
          </Button>
        </View>
      )}
    </View>
  );
};

export default DataForm;
