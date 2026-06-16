import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { ChartDataItem } from '@/types';

interface SimpleChartProps {
  title: string;
  unit?: string;
  data: ChartDataItem[];
  type?: 'bar' | 'line';
  color?: 'copper' | 'blue' | 'green' | 'orange';
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  title,
  unit,
  data,
  type = 'bar',
  color = 'copper'
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  return (
    <View className={styles.chartCard}>
      <View className={styles.chartHeader}>
        <Text className={styles.chartTitle}>{title}</Text>
        {unit && <Text className={styles.chartUnit}>单位: {unit}</Text>}
      </View>

      {type === 'bar' && (
        <View className={styles.barChart}>
          {data.map((item, index) => {
            const heightPercent = ((item.value - (minValue * 0.9)) / (range * 1.1)) * 100;
            const safeHeight = Math.max(heightPercent, 5);
            return (
              <View className={styles.barItem} key={index}>
                <View className={styles.barWrapper}>
                  <Text className={styles.barValue}>{item.value}</Text>
                  <View
                    className={classnames(styles.bar, color !== 'copper' && styles[color])}
                    style={{ height: `${safeHeight}%` }}
                  ></View>
                </View>
                <Text className={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {type === 'line' && (
        <View className={styles.lineChart}>
          <View className={styles.linePoints}>
            {data.map((item, index) => {
              const heightPercent = ((item.value - (minValue * 0.9)) / (range * 1.1)) * 100;
              const safeBottom = Math.max(heightPercent, 5);
              return (
                <View className={styles.linePoint} key={index}>
                  <Text
                    className={styles.pointValue}
                    style={{ bottom: `calc(${safeBottom}% + 20rpx)` }}
                  >
                    {item.value}
                  </Text>
                  <View
                    className={styles.pointDot}
                    style={{ bottom: `${safeBottom}%`, left: '50%' }}
                  ></View>
                  <Text className={styles.pointLabel} style={{ left: '50%' }}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

export default SimpleChart;
