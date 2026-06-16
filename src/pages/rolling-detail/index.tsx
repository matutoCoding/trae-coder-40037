import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore } from '@/store/production';
import { currentUser } from '@/data/mockData';

const MILL_OPTIONS = ['1#连轧机', '2#连轧机'];
const SPEED_OPTIONS = [10, 12, 14, 16, 18];
const DIAMETER_OPTIONS = [7.95, 7.98, 8.0, 8.02, 8.05];

const RollingDetailPage: React.FC = () => {
  const records = useProductionStore((s) => s.records.rolling);
  const moduleStatus = useProductionStore((s) => s.moduleStatus.find((m) => m.key === 'rolling'));
  const addRollingRecord = useProductionStore((s) => s.addRollingRecord);
  const getNextBatchNo = useProductionStore((s) => s.getNextBatchNo);
  const currentBatchNos = useProductionStore((s) => s.currentBatchNos);

  const last = records[0];
  const targetDiameter = 8.0;
  const toleranceRange = 0.08;

  const [isNewBatch, setIsNewBatch] = useState(true);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>('');
  const [millNo, setMillNo] = useState<string>(MILL_OPTIONS[0]);
  const [rollingSpeed, setRollingSpeed] = useState<string>('14');
  const [rodDiameter, setRodDiameter] = useState<string>('8.00');

  const finalBatchNo = isNewBatch ? getNextBatchNo() : selectedBatchNo;

  const currentDiameter = parseFloat(rodDiameter) || targetDiameter;
  const currentTolerance = Number((currentDiameter - targetDiameter).toFixed(2));
  const currentPercent = ((currentDiameter - (targetDiameter - toleranceRange)) / (toleranceRange * 2)) * 100;

  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return records.filter((r) => r.createTime.startsWith(today));
  }, [records]);

  const qualifiedRate = useMemo(() => {
    if (todayRecords.length === 0) return '0.0';
    const q = todayRecords.filter((r) => Math.abs(r.diameterTolerance) <= 0.05).length;
    return ((q / todayRecords.length) * 100).toFixed(1);
  }, [todayRecords]);

  const getTolStatus = (tol: number) => {
    if (Math.abs(tol) <= 0.03) return { text: '优', color: 'ok' };
    if (Math.abs(tol) <= 0.05) return { text: '良', color: 'warn' };
    return { text: '超差', color: 'hl' };
  };
  const tolStatus = getTolStatus(last.diameterTolerance);
  const inputTolStatus = getTolStatus(currentTolerance);

  const handleSubmit = () => {
    const spd = parseFloat(rollingSpeed);
    const dia = parseFloat(rodDiameter);
    if (isNaN(spd) || isNaN(dia)) {
      Taro.showToast({ title: '请填写完整参数', icon: 'none' });
      return;
    }
    if (!isNewBatch && !selectedBatchNo) {
      Taro.showToast({ title: '请选择或生成批次号', icon: 'none' });
      return;
    }
    addRollingRecord({
      batchNo: finalBatchNo,
      millNo,
      rollingSpeed: spd,
      rodDiameter: dia,
      inletTemp: 890 + Math.floor(Math.random() * 30),
      outletTemp: 560 + Math.floor(Math.random() * 30),
      rollingForce: 1200 + Math.floor(Math.random() * 150)
    });
    Taro.showToast({ title: '检测记录已提交', icon: 'success' });
  };

  const recordList: ListItem[] = records.map((r) => ({
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
        <Text className={styles.desc}>{millNo} · 铜杆直径检测</Text>
        <View className={styles.mainGauge}>
          <View className={styles.diameterBox}>
            <Text className={styles.value} style={{ color: inputTolStatus.color === 'hl' ? '#FCA5A5' : '#fff' }}>
              {currentDiameter.toFixed(2)}
            </Text>
            <Text className={styles.unit}> mm</Text>
            <View className={styles.label}>录入直径实时预览</View>
          </View>
          <View className={styles.toleranceInfo}>
            <View className={styles.row}>
              <Text className={styles.k}>目标直径</Text>
              <Text className={styles.v}>{targetDiameter.toFixed(2)} mm</Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.k}>直径偏差</Text>
              <Text className={styles.v} style={{ color: inputTolStatus.color === 'hl' ? '#FCA5A5' : '#fff' }}>
                {currentTolerance > 0 ? '+' : ''}{currentTolerance.toFixed(2)} mm
              </Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.k}>精度等级</Text>
              <Text className={styles.v}>{inputTolStatus.text}</Text>
            </View>
            <View className={styles.row}>
              <Text className={styles.k}>轧机编号</Text>
              <Text className={styles.v}>{millNo}</Text>
            </View>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statBox}>
            <Text className={styles.v}>{todayRecords.length}</Text>
            <Text className={styles.l}>今日检测次数</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{qualifiedRate}</Text>
            <Text className={styles.l}>今日合格率 %</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{last.rollingForce}</Text>
            <Text className={styles.l}>轧制力 kN</Text>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatusBadge
          type={moduleStatus?.status === 'warning' ? 'warning' : 'running'}
          text={moduleStatus?.status === 'warning' ? '直径偏差注意' : '直径检测正常'}
        />
        <StatusBadge type="running" text={`操作人 ${currentUser.name}`} showDot={false} />
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
          <Text>现场录入 · 新增轧制检测</Text>
        </View>
        <View className={styles.dataList}>
          <View className={styles.item}>
            <Text className={styles.label}>轧机编号</Text>
            <View className={styles.chipRowNoPad}>
              {MILL_OPTIONS.map((v) => (
                <View
                  key={v}
                  className={`${styles.chip} ${millNo === v ? styles.chipActive : ''}`}
                  onClick={() => setMillNo(v)}
                >
                  <Text>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>轧制速度</Text>
            <View className={styles.inputWrap}>
              <Input
                type="digit"
                className={styles.inputValue}
                value={rollingSpeed}
                onInput={(e) => setRollingSpeed(e.detail.value)}
                placeholder="速度"
              />
              <Text className={styles.inputUnit}>m/s</Text>
            </View>
          </View>
          <View className={styles.chipRow}>
            {SPEED_OPTIONS.map((v) => (
              <View
                key={v}
                className={`${styles.chip} ${rollingSpeed === String(v) ? styles.chipActive : ''}`}
                onClick={() => setRollingSpeed(String(v))}
              >
                <Text>{v}</Text>
              </View>
            ))}
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>铜杆直径</Text>
            <View className={styles.inputWrap}>
              <Input
                type="digit"
                className={styles.inputValue}
                value={rodDiameter}
                onInput={(e) => setRodDiameter(e.detail.value)}
                placeholder="直径φ"
              />
              <Text className={styles.inputUnit}>mm</Text>
            </View>
          </View>
          <View className={styles.chipRow}>
            {DIAMETER_OPTIONS.map((v) => (
              <View
                key={v}
                className={`${styles.chip} ${rodDiameter === String(v) ? styles.chipActive : ''}`}
                onClick={() => setRodDiameter(String(v))}
              >
                <Text>φ{v}</Text>
              </View>
            ))}
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>批次号(自动)</Text>
            <Text className={`${styles.value} ${styles.hl}`}>{finalBatchNo}</Text>
          </View>
        </View>
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
          <Text>当前轧制参数(最新)</Text>
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

      <SectionHeader title={`历史轧制记录 (${records.length})`} />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button
          className={styles.btnSecondary}
          onClick={() => {
            setMillNo(MILL_OPTIONS[0]);
            setRollingSpeed('14');
            setRodDiameter('8.00');
            Taro.showToast({ title: '已重置默认值', icon: 'none' });
          }}
        >
          重置
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交检测记录</Button>
      </View>
    </ScrollView>
  );
};

export default RollingDetailPage;
