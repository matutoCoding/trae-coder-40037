import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { furnaceRecords, currentUser, shiftNameMap } from '@/data/mockData';

const FurnaceDetailPage: React.FC = () => {
  const lastRecord = furnaceRecords[0];
  const levelPercent = lastRecord.liquidLevel;
  const isWarning = levelPercent < 75;

  const handleSubmit = () => {
    console.log('[FurnaceDetail] 提交记录');
    Taro.showToast({ title: '记录已提交', icon: 'success' });
  };

  const recordList: ListItem[] = furnaceRecords.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.operator,
    statusType: r.liquidLevel >= 75 ? 'pass' : 'warning',
    statusText: r.liquidLevel >= 75 ? '正常' : '偏低',
    data: [
      { label: '液位', value: `${r.liquidLevel}%` },
      { label: '保温温度', value: `${r.holdingTemp} ℃` }
    ]
  }));

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>保温炉监控</Text>
        <Text className={styles.desc}>1#保温炉 · 液位与保温温度实时监控</Text>
        <View className={styles.gauges}>
          <View className={styles.gaugeBox}>
            <Text className={styles.gaugeLabel}>铜液液位</Text>
            <Text className={styles.gaugeValue}>{levelPercent}%</Text>
            <View className={styles.levelBar}>
              <View className={styles.levelFill} style={{ width: `${levelPercent}%` }}></View>
            </View>
          </View>
          <View className={styles.gaugeBox}>
            <Text className={styles.gaugeLabel}>保温温度</Text>
            <Text className={styles.gaugeValue}>{lastRecord.holdingTemp}℃</Text>
            <View className={styles.levelBar}>
              <View
                className={`${styles.levelFill} ${styles.tempFill}`}
                style={{ width: `${((lastRecord.holdingTemp - 1150) / 30) * 100}%` }}
              ></View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusBadge type={isWarning ? 'warning' : 'running'} text={isWarning ? '液位偏低 注意补料' : '运行正常'} />
        <StatusBadge type="running" text={`目标液位 ${lastRecord.liquidLevelTarget}%`} showDot={false} />
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>当前参数记录</Text>
        </View>
        <View className={styles.dataGrid}>
          <View className={styles.dataBox}>
            <Text className={styles.dataLabel}>保温炉号</Text>
            <Text className={styles.dataValue}>{lastRecord.furnaceNo}</Text>
          </View>
          <View className={styles.dataBox}>
            <Text className={styles.dataLabel}>铜液液位</Text>
            <Text className={styles.dataValue} style={{ color: isWarning ? '#F59E0B' : '#10B981' }}>
              {levelPercent}%
            </Text>
            <Text className={styles.dataTarget}>目标 {lastRecord.liquidLevelTarget}%</Text>
          </View>
          <View className={styles.dataBox}>
            <Text className={styles.dataLabel}>保温温度</Text>
            <Text className={styles.dataValue}>{lastRecord.holdingTemp} ℃</Text>
            <Text className={styles.dataTarget}>目标 {lastRecord.holdingTempTarget} ℃</Text>
          </View>
          <View className={styles.dataBox}>
            <Text className={styles.dataLabel}>操作人员</Text>
            <Text className={styles.dataValue}>{currentUser.name}</Text>
            <Text className={styles.dataTarget}>{shiftNameMap[currentUser.currentShift]}</Text>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>操作提示</Text>
        </View>
        <View style={{ fontSize: 26, color: '#475569', lineHeight: 1.8 }}>
          <Text>• 当前液位 {levelPercent}%，低于目标值 {lastRecord.liquidLevelTarget}%</Text>
          <Text>{'\n'}</Text>
          <Text>• 建议在液位降至70%前完成补料操作</Text>
          <Text>{'\n'}</Text>
          <Text>• 保温温度正常范围: 1160~1170 ℃</Text>
          <Text>{'\n'}</Text>
          <Text>• 每次记录后请核对数据准确性</Text>
        </View>
      </View>

      <SectionHeader title="历史保温记录" />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button className={styles.btnSecondary} onClick={() => Taro.showToast({ title: '补料流程', icon: 'none' })}>
          补料操作
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交监控记录</Button>
      </View>
    </ScrollView>
  );
};

export default FurnaceDetailPage;
