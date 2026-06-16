import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import DataForm, { FormItemData } from '@/components/DataForm';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { meltingRecords, temperatureTrend, currentUser, shiftNameMap } from '@/data/mockData';

const MeltingDetailPage: React.FC = () => {
  const currentTemp = temperatureTrend[temperatureTrend.length - 1].value;
  const targetTemp = 1180;
  const tempDiff = currentTemp - targetTemp;

  const handleSubmit = () => {
    console.log('[MeltingDetail] 提交温度记录');
    Taro.showToast({ title: '记录已提交', icon: 'success' });
  };

  const lastRecord = meltingRecords[0];
  const currentInfo: FormItemData[] = [
    { label: '炉号', value: lastRecord.furnaceNo, highlight: true },
    { label: '当前温度', value: `${currentTemp} ℃`, variant: tempDiff >= 0 ? 'success' : 'warning' },
    { label: '目标温度', value: `${targetTemp} ℃` },
    { label: '温度偏差', value: `${tempDiff > 0 ? '+' : ''}${tempDiff} ℃` },
    { label: '操作人员', value: currentUser.name },
    { label: '所属班次', value: shiftNameMap[currentUser.currentShift] }
  ];

  const lastInfo: FormItemData[] = [
    { label: '批次号', value: lastRecord.batchNo, highlight: true },
    { label: '熔化温度', value: `${lastRecord.meltingTemp} ℃`, variant: 'success' },
    { label: '目标温度', value: `${lastRecord.targetTemp} ℃` },
    { label: '燃料消耗', value: `${lastRecord.fuelConsumption} m³` },
    { label: '熔化时长', value: `${lastRecord.meltingDuration} 分钟` },
    { label: '操作人', value: lastRecord.operator }
  ];

  const recordList: ListItem[] = meltingRecords.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.operator,
    statusType: r.meltingTemp >= 1175 ? 'pass' : 'warning',
    statusText: r.meltingTemp >= 1175 ? '正常' : '偏低',
    data: [
      { label: '熔化温度', value: `${r.meltingTemp} ℃` },
      { label: '熔化时长', value: `${r.meltingDuration} 分钟` }
    ]
  }));

  const maxTemp = Math.max(...temperatureTrend.map((t) => t.value));
  const minTemp = Math.min(...temperatureTrend.map((t) => t.value));
  const tempRange = maxTemp - minTemp || 1;

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
      <Text className={styles.title}>竖炉熔化</Text>
      <Text className={styles.desc}>1#竖炉 · 熔化温度监控</Text>
      <View style={{ display: 'flex', alignItems: 'center' }}>
        <View className={styles.bigTemp}>
          <View>
          <Text className={styles.tempValue}>{currentTemp}</Text>
          <Text className={styles.tempUnit}>℃</Text>
          <View className={styles.tempTarget}>目标 {targetTemp} ℃ · 偏差 {tempDiff > 0 ? '+' : ''}{tempDiff} ℃</View>
        </View>
        <View className={styles.tempStatus}>温度正常</View>
        </View>
      </View>
    </View>

    <View style={{ marginBottom: 8 }}>
      <StatusBadge type="running" text="1#竖炉运行中" />
    </View>

    <View className={styles.tempChartBox}>
      <View className={styles.chartTitle}>
        <Text>今日温度趋势</Text>
        <Text style={{ fontSize: 22, color: '#94A3B8' }}>每小时记录</Text>
      </View>
      <View className={styles.tempBars}>
        {temperatureTrend.map((item, idx) => {
        const h = ((item.value - minTemp) / tempRange) * 100;
        const safeH = Math.max(h, 10);
        const variant = item.value >= 1182 ? '' : item.value >= 1178 ? 'mid' : 'low';
        return (
          <View className={styles.tempBar} key={idx}>
            <Text className={styles.barValue}>{item.value}</Text>
            <View
              className={`${styles.barFill} ${variant !== '' ? styles[variant] : ''}`}
              style={{ height: `${safeH}%` }}
            ></View>
            <Text className={styles.barLabel}>{item.time}</Text>
          </View>
        );
      })}
      </View>
    </View>

    <SectionHeader title="当前熔化参数录入" />
    <DataForm
      title="实时监控数据"
      items={currentInfo}
      showActions
      primaryText="记录温度"
      secondaryText="查看曲线"
      onPrimaryClick={handleSubmit}
      onSecondaryClick={() => Taro.showToast({ title: '温度曲线详情', icon: 'none' })}
    />

    <SectionHeader title="最近记录" />
    <DataForm title="上一批次记录" items={lastInfo} />

    <SectionHeader title="历史熔化记录" />
    <RecordList records={recordList} />

    <View style={{ height: 120 }}></View>
    <View className={styles.fixedBottom}>
      <Button className={styles.btnSecondary}>手动校准</Button>
      <Button className={styles.btnPrimary} onClick={handleSubmit}>提交温度记录</Button>
    </View>
  </ScrollView>
  );
};

export default MeltingDetailPage;
