import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore } from '@/store/production';
import { currentUser, shiftNameMap } from '@/data/mockData';

const CASTING_SPEED_OPTIONS = [2.5, 3.0, 3.5, 4.0, 4.5];
const CASTING_TEMP_OPTIONS = [1140, 1150, 1160, 1165, 1170];
const BILLET_TEMP_OPTIONS = [960, 970, 980, 990, 1000];

const CastingDetailPage: React.FC = () => {
  const records = useProductionStore((s) => s.records.casting);
  const moduleStatus = useProductionStore((s) => s.moduleStatus.find((m) => m.key === 'casting'));
  const addCastingRecord = useProductionStore((s) => s.addCastingRecord);
  const getNextBatchNo = useProductionStore((s) => s.getNextBatchNo);

  const last = records[0];
  const [castingSpeed, setCastingSpeed] = useState<string>('3.5');
  const [castingTemp, setCastingTemp] = useState<string>('1160');
  const [billetTemp, setBilletTemp] = useState<string>('980');

  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return records.filter((r) => r.createTime.startsWith(today));
  }, [records]);

  const avgSpeed = useMemo(() => {
    if (todayRecords.length === 0) return '0.0';
    const sum = todayRecords.reduce((s, r) => s + r.castingWheelSpeed, 0);
    return (sum / todayRecords.length).toFixed(1);
  }, [todayRecords]);

  const handleSubmit = () => {
    const spd = parseFloat(castingSpeed);
    const ct = parseFloat(castingTemp);
    const bt = parseFloat(billetTemp);
    if (isNaN(spd) || isNaN(ct) || isNaN(bt)) {
      Taro.showToast({ title: '请填写完整参数', icon: 'none' });
      return;
    }
    addCastingRecord({
      castingWheelSpeed: spd,
      castingTemp: ct,
      billetTemp: bt,
      castingLength: Math.floor(300 + Math.random() * 120)
    });
    const newBatch = getNextBatchNo();
    Taro.showToast({ title: `记录已提交 ${newBatch}`, icon: 'success' });
  };

  const recordList: ListItem[] = records.map((r) => ({
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

  const statusBadgeType = moduleStatus?.status === 'warning' ? 'warning' : 'running';
  const statusBadgeText = moduleStatus?.status === 'warning' ? '温度异常注意' : '连铸轮运行正常';

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
            <Text className={styles.statValue}>{todayRecords.length}</Text>
            <Text className={styles.statLabel}>今日浇铸次数</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.statValue}>{avgSpeed}</Text>
            <Text className={styles.statLabel}>平均速度 m/min</Text>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatusBadge type={statusBadgeType} text={statusBadgeText} />
        <StatusBadge type="running" text={`${shiftNameMap[currentUser.currentShift]}值班`} showDot={false} />
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>现场录入 · 新增浇铸记录</Text>
        </View>
        <View className={styles.dataList}>
          <View className={styles.item}>
            <Text className={styles.label}>浇铸速度</Text>
            <View className={styles.inputWrap}>
              <Input
                type="digit"
                className={styles.inputValue}
                value={castingSpeed}
                onInput={(e) => setCastingSpeed(e.detail.value)}
                placeholder="请输入速度"
              />
              <Text className={styles.inputUnit}>m/min</Text>
            </View>
          </View>
          <View className={styles.chipRow}>
            {CASTING_SPEED_OPTIONS.map((v) => (
              <View
                key={v}
                className={`${styles.chip} ${castingSpeed === String(v) ? styles.chipActive : ''}`}
                onClick={() => setCastingSpeed(String(v))}
              >
                <Text>{v}</Text>
              </View>
            ))}
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>浇铸温度</Text>
            <View className={styles.inputWrap}>
              <Input
                type="digit"
                className={styles.inputValue}
                value={castingTemp}
                onInput={(e) => setCastingTemp(e.detail.value)}
                placeholder="请输入温度"
              />
              <Text className={styles.inputUnit}>℃</Text>
            </View>
          </View>
          <View className={styles.chipRow}>
            {CASTING_TEMP_OPTIONS.map((v) => (
              <View
                key={v}
                className={`${styles.chip} ${castingTemp === String(v) ? styles.chipActive : ''}`}
                onClick={() => setCastingTemp(String(v))}
              >
                <Text>{v}℃</Text>
              </View>
            ))}
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>铸坯出口温度</Text>
            <View className={styles.inputWrap}>
              <Input
                type="digit"
                className={styles.inputValue}
                value={billetTemp}
                onInput={(e) => setBilletTemp(e.detail.value)}
                placeholder="请输入出口温度"
              />
              <Text className={styles.inputUnit}>℃</Text>
            </View>
          </View>
          <View className={styles.chipRow}>
            {BILLET_TEMP_OPTIONS.map((v) => (
              <View
                key={v}
                className={`${styles.chip} ${billetTemp === String(v) ? styles.chipActive : ''}`}
                onClick={() => setBilletTemp(String(v))}
              >
                <Text>{v}℃</Text>
              </View>
            ))}
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>批次号(自动)</Text>
            <Text className={`${styles.value} ${styles.hl}`}>{getNextBatchNo()}</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>操作人</Text>
            <Text className={styles.value}>{currentUser.name}</Text>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>温度监控点(最新)</Text>
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

      <SectionHeader title={`历史浇铸记录 (${records.length})`} />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button
          className={styles.btnSecondary}
          onClick={() => {
            setCastingSpeed('3.5');
            setCastingTemp('1160');
            setBilletTemp('980');
            Taro.showToast({ title: '已重置默认值', icon: 'none' });
          }}
        >
          重置
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交浇铸记录</Button>
      </View>
    </ScrollView>
  );
};

export default CastingDetailPage;
