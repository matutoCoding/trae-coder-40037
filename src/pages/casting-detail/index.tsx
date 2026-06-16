import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { castingRecords, currentUser, shiftNameMap } from '@/data/mockData';

const CastingDetailPage: React.FC = () => {
  const last = castingRecords[0];

  const handleSubmit = () => {
    console.log('[CastingDetail] 提交记录');
    Taro.showToast({ title: '记录已提交', icon: 'success' });
  };

  const recordList: ListItem[] = castingRecords.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.operator,
    statusType: 'pass',
    statusText: '正常',
    data: [
      { label: '铸坯温度', value: `${r.billetTemp} ℃` },
      { label: '浇铸速度', value: `${r.castingWheelSpeed} m/min` }
    ]
  }));

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>连铸成型</Text>
        <Text className={styles.desc}>连铸轮浇铸 · 铸坯温度控制</Text>
        <View className={styles.stats}>
          <View className={styles.statBox}>
            <Text className={styles.statValue}>{last.castingWheelSpeed}</Text>
            <Text className={styles.statLabel}>浇铸速度 m/min</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.statValue}>{last.castingLength}</Text>
            <Text className={styles.statLabel}>浇铸长度 m</Text>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusBadge type="running" text="连铸轮运行正常" />
        <StatusBadge type="running" text={`${shiftNameMap[currentUser.currentShift]}值班`} showDot={false} />
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>温度监控点</Text>
        </View>
        <View className={styles.tempRow}>
          <View className={styles.tempCard}>
            <Text className={styles.v} style={{ color: '#DC2626' }}>{last.castingTemp}℃</Text>
            <Text className={styles.l}>浇铸温度</Text>
          </View>
          <View className={styles.tempCard}>
            <Text className={styles.v} style={{ color: '#F97316' }}>{last.billetTemp}℃</Text>
            <Text className={styles.l}>铸坯出口温度</Text>
          </View>
          <View className={styles.tempCard}>
            <Text className={styles.v} style={{ color: '#3B82F6' }}>
              {last.billetTemp - 20}℃
            </Text>
            <Text className={styles.l}>二次冷却区</Text>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>当前浇铸参数</Text>
        </View>
        <View className={styles.dataList}>
          <View className={styles.item}>
            <Text className={styles.label}>批次号</Text>
            <Text className={`${styles.value} ${styles.hl}`}>{last.batchNo}</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>连铸轮转速</Text>
            <Text className={styles.value}>{last.castingWheelSpeed} m/min</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>浇铸温度</Text>
            <Text className={`${styles.value} ${styles.ok}`}>{last.castingTemp} ℃</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>铸坯尺寸</Text>
            <Text className={styles.value}>{last.billetSize}</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>铸坯温度</Text>
            <Text className={`${styles.value} ${styles.ok}`}>{last.billetTemp} ℃</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>本次浇铸长度</Text>
            <Text className={styles.value}>{last.castingLength} m</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>操作人员</Text>
            <Text className={styles.value}>{last.operator}</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="历史浇铸记录" />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button className={styles.btnSecondary} onClick={() => Taro.showToast({ title: '参数调整', icon: 'none' })}>
          调整参数
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交浇铸记录</Button>
      </View>
    </ScrollView>
  );
};

export default CastingDetailPage;
