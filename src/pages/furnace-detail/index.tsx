import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore } from '@/store/production';
import { currentUser, shiftNameMap } from '@/data/mockData';

const FurnaceDetailPage: React.FC = () => {
  const { records, addFurnaceRecord, moduleStatus, getNextBatchNo, currentBatchNos } = useProductionStore();
  const furnaceList = records.furnace;
  const [isNewBatch, setIsNewBatch] = useState(true);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>('');
  const [level, setLevel] = useState<string>('75');
  const [temp, setTemp] = useState<string>('1166');
  const [furnaceNo, setFurnaceNo] = useState<string>('1#保温炉');

  const finalBatchNo = isNewBatch ? getNextBatchNo() : selectedBatchNo;

  const modStatus = moduleStatus.find((m) => m.key === 'furnace');
  const isWarning = Number(level) < 75;

  const lastRecord = furnaceList[0];
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const list = furnaceList.filter((r) => r.createTime.startsWith(today));
    const avgLevel = list.length > 0 ? list.reduce((s, r) => s + r.liquidLevel, 0) / list.length : 0;
    const avgTemp = list.length > 0 ? list.reduce((s, r) => s + r.holdingTemp, 0) / list.length : 0;
    return { count: list.length, avgLevel: avgLevel.toFixed(0), avgTemp: avgTemp.toFixed(0) };
  }, [furnaceList]);

  const handleSubmit = () => {
    const lv = Number(level);
    const tp = Number(temp);
    if (!lv || lv < 30 || lv > 100) {
      Taro.showToast({ title: '液位范围30-100%', icon: 'none' });
      return;
    }
    if (!tp || tp < 1100 || tp > 1200) {
      Taro.showToast({ title: '温度范围1100-1200℃', icon: 'none' });
      return;
    }
    if (!isNewBatch && !selectedBatchNo) {
      Taro.showToast({ title: '请选择或生成批次号', icon: 'none' });
      return;
    }
    addFurnaceRecord({
      batchNo: finalBatchNo,
      furnaceNo,
      liquidLevel: lv,
      holdingTemp: tp,
      liquidLevelTarget: 80,
      holdingTempTarget: 1165
    });
    Taro.showToast({ title: '记录已录入', icon: 'success' });
    console.log('[FurnaceDetail] 录入:', lv, tp);
  };

  const recordList: ListItem[] = furnaceList.map((r) => ({
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
        <Text className={styles.desc}>{furnaceNo} · 液位与保温温度实时监控</Text>
        <View className={styles.gauges}>
          <View className={styles.gaugeBox}>
            <Text className={styles.gaugeLabel}>铜液液位</Text>
            <Text className={styles.gaugeValue}>{level}%</Text>
            <View className={styles.levelBar}>
              <View className={styles.levelFill} style={{ width: `${level}%` }}></View>
            </View>
          </View>
          <View className={styles.gaugeBox}>
            <Text className={styles.gaugeLabel}>保温温度</Text>
            <Text className={styles.gaugeValue}>{temp}℃</Text>
            <View className={styles.levelBar}>
              <View
                className={`${styles.levelFill} ${styles.tempFill}`}
                style={{ width: `${((Number(temp) - 1150) / 30) * 100}%` }}
              ></View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusBadge
          type={isWarning ? 'warning' : modStatus?.status || 'running'}
          text={isWarning ? '液位偏低 注意补料' : '运行正常'}
        />
        <StatusBadge type="running" text={`今日记录 ${stats.count} 次`} showDot={false} />
      </View>

      <View className={styles.inputForm}>
        <View className={styles.formTitle}>
          <View className={styles.bar}></View>
          <Text>📋 选择批次号</Text>
        </View>
        <View style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <View style={{ display: 'flex', gap: 12 }}>
            <View
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 8,
                background: isNewBatch ? 'rgba(184,115,51,0.12)' : '#F8FAFC',
                border: isNewBatch ? '2rpx solid rgba(184,115,51,0.4)' : '2rpx solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                cursor: 'pointer'
              }}
              onClick={() => setIsNewBatch(true)}
            >
              <Text style={{ fontSize: 13, color: isNewBatch ? '#B87333' : '#475569', fontWeight: isNewBatch ? 600 : 400 }}>🆕 自动生成新批次</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>{getNextBatchNo()}</Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 8,
                background: !isNewBatch ? 'rgba(184,115,51,0.12)' : '#F8FAFC',
                border: !isNewBatch ? '2rpx solid rgba(184,115,51,0.4)' : '2rpx solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                cursor: 'pointer'
              }}
              onClick={() => {
                setIsNewBatch(false);
                if (currentBatchNos.length > 0 && !selectedBatchNo) {
                  setSelectedBatchNo(currentBatchNos[0]);
                }
              }}
            >
              <Text style={{ fontSize: 13, color: !isNewBatch ? '#B87333' : '#475569', fontWeight: !isNewBatch ? 600 : 400 }}>🔗 沿用已有批次</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>共{currentBatchNos.length}个可选</Text>
            </View>
          </View>
          {!isNewBatch && currentBatchNos.length > 0 && (
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#64748B', width: '100%', marginBottom: 4 }}>最近批次（点击选择）：</Text>
              {currentBatchNos.slice(0, 10).map((b) => (
                <View
                  key={b}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: selectedBatchNo === b ? '#B87333' : '#FFFFFF',
                    border: selectedBatchNo === b ? 'none' : '1px solid #E2E8F0'
                  }}
                  onClick={() => setSelectedBatchNo(b)}
                >
                  <Text style={{ fontSize: 12, color: selectedBatchNo === b ? '#FFFFFF' : '#475569', fontWeight: selectedBatchNo === b ? 600 : 400 }}>
                    {b}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>📊 现场录入参数</Text>
        </View>
        <View className={styles.dataGrid}>
          <View className={styles.dataBox}>
            <Text style={{ fontSize: 24, color: '#94A3B8', display: 'block', marginBottom: 8 }}>保温炉号</Text>
            <View style={{ display: 'flex', gap: 8 }}>
              {['1#保温炉', '2#保温炉'].map((f) => (
                <Text
                  key={f}
                  onClick={() => setFurnaceNo(f)}
                  style={{
                    flex: 1,
                    padding: '12rpx 16rpx',
                    borderRadius: 12,
                    textAlign: 'center',
                    background: furnaceNo === f ? 'rgba(184,115,51,0.15)' : '#F8FAFC',
                    color: furnaceNo === f ? '#B87333' : '#475569',
                    fontWeight: furnaceNo === f ? 600 : 400,
                    border: furnaceNo === f ? '2rpx solid rgba(184,115,51,0.35)' : '2rpx solid transparent',
                    fontSize: 24
                  }}
                >
                  {f}
                </Text>
              ))}
            </View>
          </View>
          <View className={styles.dataBox}>
            <Text style={{ fontSize: 24, color: '#94A3B8', display: 'block', marginBottom: 8 }}>
              铜液液位 (%) <Text style={{ color: isWarning ? '#F59E0B' : '#94A3B8' }}>目标 80</Text>
            </Text>
            <Input
              type="digit"
              value={level}
              onInput={(e: any) => setLevel(e.detail.value)}
              style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: '12rpx 20rpx',
                fontSize: 32,
                fontWeight: 700,
                color: isWarning ? '#F59E0B' : '#10B981'
              }}
            />
            <View style={{ display: 'flex', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
              {[70, 75, 80, 85, 90].map((v) => (
                <Text
                  key={v}
                  onClick={() => setLevel(String(v))}
                  style={{
                    padding: '6rpx 14rpx',
                    borderRadius: 999,
                    background: Number(level) === v ? 'linear-gradient(135deg,#B87333,#D4A574)' : '#F1F5F9',
                    color: Number(level) === v ? '#fff' : '#475569',
                    fontSize: 20,
                    fontWeight: Number(level) === v ? 600 : 400
                  }}
                >
                  {v}%
                </Text>
              ))}
            </View>
          </View>
          <View className={styles.dataBox}>
            <Text style={{ fontSize: 24, color: '#94A3B8', display: 'block', marginBottom: 8 }}>
              保温温度 (℃) <Text style={{ color: '#94A3B8' }}>目标 1165</Text>
            </Text>
            <Input
              type="digit"
              value={temp}
              onInput={(e: any) => setTemp(e.detail.value)}
              style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: '12rpx 20rpx',
                fontSize: 32,
                fontWeight: 700,
                color: '#0F172A'
              }}
            />
            <View style={{ display: 'flex', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
              {[1160, 1163, 1165, 1167, 1170].map((v) => (
                <Text
                  key={v}
                  onClick={() => setTemp(String(v))}
                  style={{
                    padding: '6rpx 14rpx',
                    borderRadius: 999,
                    background: Number(temp) === v ? 'linear-gradient(135deg,#EF4444,#F87171)' : '#F1F5F9',
                    color: Number(temp) === v ? '#fff' : '#475569',
                    fontSize: 20,
                    fontWeight: Number(temp) === v ? 600 : 400
                  }}
                >
                  {v}℃
                </Text>
              ))}
            </View>
          </View>
          <View className={styles.dataBox}>
            <Text style={{ fontSize: 24, color: '#94A3B8', display: 'block', marginBottom: 8 }}>操作信息</Text>
            <Text style={{ fontSize: 26, color: '#0F172A', fontWeight: 500 }}>
              {currentUser.name}
            </Text>
            <Text style={{ fontSize: 22, color: '#64748B', marginTop: 4 }}>
              {shiftNameMap[currentUser.currentShift]}
            </Text>
          </View>
        </View>
        <View style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Button
            onClick={() => Taro.showToast({ title: '补料申请已提交', icon: 'success' })}
            style={{
              flex: 1,
              height: 80,
              borderRadius: 48,
              background: '#F8FAFC',
              color: '#475569',
              fontSize: 26,
              border: '1rpx solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            申请补料
          </Button>
          <Button
            onClick={handleSubmit}
            style={{
              flex: 2,
              height: 80,
              borderRadius: 48,
              background: 'linear-gradient(135deg,#B87333 0%,#D4A574 100%)',
              color: '#fff',
              fontSize: 28,
              fontWeight: 600,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            提交监控记录
          </Button>
        </View>
      </View>

      {lastRecord && (
        <View className={styles.infoCard}>
          <View className={styles.cardTitle}>
            <View className={styles.bar}></View>
            <Text>操作提示</Text>
          </View>
          <View style={{ fontSize: 26, color: '#475569', lineHeight: 1.8 }}>
            <Text>• 当前液位 {level}%，{Number(level) < 75 ? '⚠️ 低于目标值，建议尽快补料' : '正常范围'}</Text>
            <Text>{'\n'}</Text>
            <Text>• 保温温度正常范围: 1160~1170 ℃，当前 {temp}℃</Text>
            <Text>{'\n'}</Text>
            <Text>• 今日平均液位 {stats.avgLevel}%，平均温度 {stats.avgTemp}℃</Text>
            <Text>{'\n'}</Text>
            <Text>• 操作人：{currentUser.name} · {shiftNameMap[currentUser.currentShift]}</Text>
          </View>
        </View>
      )}

      <SectionHeader title={`历史记录 (共${recordList.length}条)`} />
      <RecordList records={recordList} />
      <View style={{ height: 40 }}></View>
    </ScrollView>
  );
};

export default FurnaceDetailPage;
