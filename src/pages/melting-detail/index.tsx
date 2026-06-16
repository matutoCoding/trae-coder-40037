import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore } from '@/store/production';

const MeltingDetailPage: React.FC = () => {
  const { records, addMeltingRecord, moduleStatus, temperatureTrend, getNextBatchNo, currentBatchNos } = useProductionStore();
  const meltingList = records.melting;

  const [isNewBatch, setIsNewBatch] = useState(true);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>('');
  const [meltTemp, setMeltTemp] = useState<string>('1182');
  const [furnaceNo, setFurnaceNo] = useState<string>('1#竖炉');
  const targetTemp = 1180;

  const finalBatchNo = isNewBatch ? getNextBatchNo() : selectedBatchNo;

  const modStatus = moduleStatus.find((m) => m.key === 'melting');

  const currentTemp = useMemo(
    () => (temperatureTrend.length > 0 ? temperatureTrend[temperatureTrend.length - 1].value : 1180),
    [temperatureTrend]
  );
  const tempDiff = currentTemp - targetTemp;

  const maxTemp = Math.max(...temperatureTrend.map((t) => t.value));
  const minTemp = Math.min(...temperatureTrend.map((t) => t.value));
  const tempRange = maxTemp - minTemp || 1;

  const handleSubmit = () => {
    const t = Number(meltTemp);
    if (!t || t < 1000 || t > 1300) {
      Taro.showToast({ title: '温度范围1000-1300℃', icon: 'none' });
      return;
    }
    if (!isNewBatch && !selectedBatchNo) {
      Taro.showToast({ title: '请选择或生成批次号', icon: 'none' });
      return;
    }
    addMeltingRecord({ batchNo: finalBatchNo, furnaceNo, meltingTemp: t, targetTemp });
    Taro.showToast({ title: '温度记录已录入', icon: 'success' });
    console.log('[MeltingDetail] 录入温度:', t);
    setMeltTemp(String(t));
  };

  const recordList: ListItem[] = meltingList.map((r) => ({
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
              <View className={styles.tempTarget}>
                目标 {targetTemp} ℃ · 偏差 {tempDiff > 0 ? '+' : ''}
                {tempDiff} ℃
              </View>
            </View>
            <View className={styles.tempStatus}>
              {currentTemp >= 1175 ? '温度正常' : '温度偏低'}
            </View>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusBadge type={modStatus?.status || 'running'} text={modStatus?.status === 'running' ? '竖炉运行中' : '注意'} />
        <StatusBadge type="running" text={`${furnaceNo}`} showDot={false} />
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

      <View
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)',
          marginBottom: 16
        }}
      >
        <View className={styles.chartTitle}>
          <Text>🌡 现场录入温度</Text>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 24, color: '#64748B', marginBottom: 8, display: 'block' }}>
            竖炉选择
          </Text>
          <View style={{ display: 'flex', gap: 12 }}>
            {['1#竖炉', '2#竖炉'].map((f) => (
              <Text
                key={f}
                onClick={() => setFurnaceNo(f)}
                style={{
                  flex: 1,
                  height: 72,
                  lineHeight: '72rpx',
                  textAlign: 'center',
                  borderRadius: 12,
                  background: furnaceNo === f ? 'rgba(220,38,38,0.1)' : '#F8FAFC',
                  color: furnaceNo === f ? '#DC2626' : '#475569',
                  fontWeight: furnaceNo === f ? 600 : 400,
                  border: furnaceNo === f ? '2rpx solid rgba(220,38,38,0.3)' : '2rpx solid transparent',
                  fontSize: 26
                }}
              >
                {f}
              </Text>
            ))}
          </View>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 24, color: '#64748B', marginBottom: 8, display: 'block' }}>
            当前熔化温度 (℃)
          </Text>
          <Input
            type="digit"
            value={meltTemp}
            onInput={(e: any) => setMeltTemp(e.detail.value)}
            style={{
              background: '#F8FAFC',
              borderRadius: 12,
              padding: '16rpx 24rpx',
              fontSize: 36,
              fontWeight: 600,
              color: Number(meltTemp) >= 1175 ? '#10B981' : '#F59E0B',
              border: `2rpx solid ${Number(meltTemp) >= 1175 ? 'transparent' : 'rgba(245,158,11,0.3)'}`
            }}
            placeholder="请输入熔化温度"
          />
          <View style={{ display: 'flex', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
            {[1170, 1175, 1180, 1185, 1190].map((v) => (
              <Text
                key={v}
                onClick={() => setMeltTemp(String(v))}
                style={{
                  padding: '8rpx 16rpx',
                  borderRadius: 999,
                  background: Number(meltTemp) === v ? 'linear-gradient(135deg,#DC2626,#F87171)' : '#F1F5F9',
                  color: Number(meltTemp) === v ? '#fff' : '#475569',
                  fontSize: 22,
                  fontWeight: Number(meltTemp) === v ? 600 : 400
                }}
              >
                {v}℃
              </Text>
            ))}
          </View>
        </View>
        <View style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Button
            onClick={() => Taro.showToast({ title: '自动采集已启用', icon: 'none' })}
            style={{
              flex: 1,
              height: 80,
              borderRadius: 48,
              background: '#F1F5F9',
              color: '#475569',
              fontSize: 26,
              border: '1rpx solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            自动读取
          </Button>
          <Button
            onClick={handleSubmit}
            style={{
              flex: 2,
              height: 80,
              borderRadius: 48,
              background: 'linear-gradient(135deg,#DC2626 0%,#F87171 100%)',
              color: '#fff',
              fontSize: 28,
              fontWeight: 600,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            提交温度记录
          </Button>
        </View>
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

      <SectionHeader title={`历史熔化记录 (共${recordList.length}条)`} />
      <RecordList records={recordList} />
      <View style={{ height: 40 }}></View>
    </ScrollView>
  );
};

export default MeltingDetailPage;
