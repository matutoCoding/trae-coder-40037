import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { rollingRecords, currentUser } from '@/data/mockData';

const RollingDetailPage: React.FC = () => {
  const last = rollingRecords[0];
  const targetDiameter = 8.0;
  const toleranceRange = 0.08;
  const currentPercent = ((last.rodDiameter - (targetDiameter - toleranceRange)) / (toleranceRange * 2)) * 100;

  const handleSubmit = () => {
    console.log('[RollingDetail] 提交记录');
    Taro.showToast({ title: '记录已提交', icon: 'success' });
  };

  const getTolStatus = () => {
    if (Math.abs(last.diameterTolerance) <= 0.03) return { text: '优', color: 'ok' };
    if (Math.abs(last.diameterTolerance) <= 0.05) return { text: '良', color: 'warn' };
    return { text: '超差', color: 'hl' };
  };
  const tolStatus = getTolStatus();

  const recordList: ListItem[] = rollingRecords.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.operator,
    statusType: Math.abs(r.diameterTolerance) <= 0.05 ? 'pass' : 'warning',
    statusText: Math.abs(r.diameterTolerance) <= 0.05 ? '合格' : '偏差',
    data: [
      { label: '铜杆直径', value: `${r.rodDiameter} mm` },
      { label: '轧制速度', value: `${r.rollingSpeed} m/s` }
    ]
  }));

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>连轧拉拔</Text>
        <Text className={styles.desc}>1#连轧机 · 铜杆直径检测</Text>
        <View className={styles.mainGauge}>
          <View className={styles.diameterBox}>
            <Text className={styles.value}>{last.rodDiameter}</Text>
            <Text className={styles.unit}> mm</Text>
            <View className={styles.label}>当前铜杆直径</View>
          </View>
          <View className={styles.toleranceInfo}>
            <View className={styles.row}>
              <Text className={styles.k}>目标直径</Text>
              <Text className={styles.v}>{targetDiameter} mm</Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.k}>直径偏差</Text>
              <Text className={styles.v} style={{ color: tolStatus.color === 'hl' ? '#F59E0B' : '#fff' }}>
                {last.diameterTolerance > 0 ? '+' : ''}{last.diameterTolerance} mm
              </Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.k}>精度等级</Text>
              <Text className={styles.v}>{tolStatus.text}</Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.k}>轧机编号</Text>
              <Text className={styles.v}>{last.millNo}</Text>
            </View>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statBox}>
            <Text className={styles.v}>{last.rollingSpeed}</Text>
            <Text className={styles.l}>轧制速度 m/s</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{last.inletTemp}</Text>
            <Text className={styles.l}>入口温度 ℃</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{last.rollingForce}</Text>
            <Text className={styles.l}>轧制力 kN</Text>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusBadge type={tolStatus.color === 'hl' ? 'warning' : 'running'} text={tolStatus.color === 'hl' ? '偏差注意' : '直径检测正常'} />
        <StatusBadge type="running" text={`操作人 ${currentUser.name}`} showDot={false} />
      </View>

      <View className={styles.diameterBar}>
        <View className={styles.title}>直径公差带可视化 (目标 φ{targetDiameter}±{toleranceRange}mm)</View>
        <View className={styles.barTrack}>
          <View className={styles.barFill} style={{ width: '100%' }}></View>
          <View className={styles.pointer} style={{ left: `${Math.min(Math.max(currentPercent, 2), 98)}%` }}></View>
        </View>
        <View className={styles.labels}>
          <Text>{(targetDiameter - toleranceRange).toFixed(2)}</Text>
          <Text style={{ color: '#10B981' }}>{targetDiameter.toFixed(2)}</Text>
          <Text>{(targetDiameter + toleranceRange).toFixed(2)}</Text>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>当前轧制参数</Text>
        </View>
        <View className={styles.dataList}>
          <View className={styles.item}>
            <Text className={styles.label}>批次号</Text>
            <Text className={`${styles.value} ${styles.hl}`}>{last.batchNo}</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>轧制速度</Text>
            <Text className={styles.value}>{last.rollingSpeed} m/s</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>入口温度</Text>
            <Text className={`${styles.value} ${styles.ok}`}>{last.inletTemp} ℃</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>出口温度</Text>
            <Text className={styles.value}>{last.outletTemp} ℃</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>铜杆直径</Text>
            <Text className={`${styles.value} ${tolStatus.color}`}>{last.rodDiameter} mm</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>轧制力</Text>
            <Text className={styles.value}>{last.rollingForce} kN</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="历史轧制记录" />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button className={styles.btnSecondary} onClick={() => Taro.showToast({ title: '在线检测', icon: 'none' })}>
          激光检测
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交检测记录</Button>
      </View>
    </ScrollView>
  );
};

export default RollingDetailPage;
