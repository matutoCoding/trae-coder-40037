import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore } from '@/store/production';
import { qualityNameMap, currentUser } from '@/data/mockData';
import type { QualityResult } from '@/types';

const OXIDE_OPTIONS: Array<{ v: QualityResult; label: string }> = [
  { v: 'pass', label: '合格(光洁)' },
  { v: 'warning', label: '观察(轻微)' },
  { v: 'fail', label: '不合格(氧化斑)' }
];
const WEIGHT_OPTIONS = [2400, 2450, 2500, 2550, 2600];
const RESISTIVITY_STANDARD = 0.01724;

const InspectionDetailPage: React.FC = () => {
  const records = useProductionStore((s) => s.records.inspection);
  const moduleStatus = useProductionStore((s) => s.moduleStatus.find((m) => m.key === 'inspection'));
  const addInspectionRecord = useProductionStore((s) => s.addInspectionRecord);
  const getNextBatchNo = useProductionStore((s) => s.getNextBatchNo);

  const last = records[0];

  const [surfaceOxidation, setSurfaceOxidation] = useState<QualityResult>('pass');
  const [oxidationDetail, setOxidationDetail] = useState<string>('表面光洁，无氧化斑');
  const [resistivity, setResistivity] = useState<string>('0.01720');
  const [weighbridgeWeight, setWeighbridgeWeight] = useState<string>('2500');

  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return records.filter((r) => r.createTime.startsWith(today));
  }, [records]);

  const todayPassRate = useMemo(() => {
    if (todayRecords.length === 0) return '0.0';
    const p = todayRecords.filter((r) => r.overallResult === 'pass').length;
    return ((p / todayRecords.length) * 100).toFixed(1);
  }, [todayRecords]);

  const resistNum = parseFloat(resistivity) || RESISTIVITY_STANDARD;
  const resistPass = resistNum <= RESISTIVITY_STANDARD;

  const overallResult: QualityResult = useMemo(() => {
    if (surfaceOxidation === 'fail') return 'fail';
    if (!resistPass) return 'fail';
    if (surfaceOxidation === 'warning') return 'warning';
    return 'pass';
  }, [surfaceOxidation, resistPass]);

  const overallInfo = qualityNameMap[overallResult];

  const handleSubmit = () => {
    const w = parseFloat(weighbridgeWeight);
    const r = parseFloat(resistivity);
    if (isNaN(w) || isNaN(r)) {
      Taro.showToast({ title: '请填写完整参数', icon: 'none' });
      return;
    }
    addInspectionRecord({
      surfaceOxidation,
      oxidationDetail,
      resistivity: r,
      resistivityStandard: RESISTIVITY_STANDARD,
      weighbridgeWeight: w,
      overallResult,
      inspector: currentUser.name
    });
    Taro.showToast({ title: `检验${overallInfo.text}`, icon: overallResult === 'fail' ? 'error' : 'success' });
  };

  const recordList: ListItem[] = records.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.inspector,
    statusType: r.overallResult,
    statusText: qualityNameMap[r.overallResult].text,
    data: [
      { label: '过磅重量', value: `${r.weighbridgeWeight} kg` },
      { label: '电阻率', value: `${r.resistivity.toFixed(5)}` }
    ]
  }));

  const curW = parseFloat(weighbridgeWeight) || last.weighbridgeWeight;

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>成品检验</Text>
        <Text className={styles.desc}>表面氧化 · 电阻率 · 过磅</Text>
        <View className={styles.resultBox}>
          <Text className={styles.resultText} style={{ color: overallInfo.color }}>
            {overallInfo.text}
          </Text>
          <Text className={styles.resultLabel}>录入综合判定预览</Text>
          <View className={styles.batchInfo}>
            <Text>批次 {getNextBatchNo()} · 检验员 {currentUser.name}</Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statBox}>
            <Text className={styles.v}>{todayRecords.length}</Text>
            <Text className={styles.l}>今日检验</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{todayPassRate}</Text>
            <Text className={styles.l}>合格率 %</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{moduleStatus?.currentValue || '98.5'}</Text>
            <Text className={styles.l}>累计合格率 %</Text>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatusBadge
          type={overallResult === 'fail' ? 'warning' : 'running'}
          text={overallResult === 'fail' ? '存在不合格项' : '检验流程正常'}
        />
      </View>

      <View className={styles.inspectionItems}>
        <View className={`${styles.inspectCard} ${surfaceOxidation === 'fail' ? styles.fail : ''}`}>
          <View className={styles.head}>
            <Text className={styles.name}>① 表面氧化检查</Text>
            <View className={`${styles.tag} ${styles[surfaceOxidation === 'fail' ? 'warn' : 'pass']}`}>
              {qualityNameMap[surfaceOxidation].text}
            </View>
          </View>
          <View className={styles.content}>
            <View className={styles.chipRowNoPad} style={{ marginBottom: 16 }}>
              {OXIDE_OPTIONS.map((o) => (
                <View
                  key={o.v}
                  className={`${styles.chip} ${surfaceOxidation === o.v ? styles.chipActive : ''}`}
                  onClick={() => {
                    setSurfaceOxidation(o.v);
                    if (o.v === 'fail') setOxidationDetail('发现明显氧化斑，需处理');
                    else if (o.v === 'warning') setOxidationDetail('轻微氧化迹，持续观察');
                    else setOxidationDetail('表面光洁，无氧化斑');
                  }}
                >
                  <Text>{o.label}</Text>
                </View>
              ))}
            </View>
            <Textarea
              className={styles.textarea}
              value={oxidationDetail}
              onInput={(e) => setOxidationDetail(e.detail.value)}
              placeholder="请输入氧化检查详情"
              maxlength={100}
            />
          </View>
        </View>

        <View className={`${styles.inspectCard} ${!resistPass ? styles.fail : ''}`}>
          <View className={styles.head}>
            <Text className={styles.name}>② 电阻率检测</Text>
            <View className={`${styles.tag} ${resistPass ? styles.pass : styles.fail}`}>
              {resistPass ? '合格' : '超差'}
            </View>
          </View>
          <View className={styles.content}>
            <View style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <View className={styles.inputWrap}>
                <Input
                  type="digit"
                  className={styles.inputValueBig}
                  value={resistivity}
                  onInput={(e) => setResistivity(e.detail.value)}
                  placeholder="电阻率"
                />
                <Text className={styles.unit}>Ω·mm²/m</Text>
              </View>
            </View>
            <View className={styles.tip}>
              标准 ≤ {RESISTIVITY_STANDARD.toFixed(5)}
              {resistPass ? ' · 满足要求' : ' · 超出标准'}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.weighCard}>
        <View className={styles.title}>
          <View className={styles.bar}></View>
          <Text>③ 成品过磅</Text>
        </View>
        <View className={styles.weightMain}>
          <Text className={styles.wv}>{curW}</Text>
          <Text className={styles.wu}>kg</Text>
        </View>
        <View className={styles.chipRowNoPad} style={{ marginTop: 8, marginBottom: 16 }}>
          {WEIGHT_OPTIONS.map((v) => (
            <View
              key={v}
              className={`${styles.chip} ${weighbridgeWeight === String(v) ? styles.chipActive : ''}`}
              onClick={() => setWeighbridgeWeight(String(v))}
            >
              <Text>{v}kg</Text>
            </View>
          ))}
        </View>
        <View className={styles.item}>
          <Text className={styles.label}>或手动输入重量</Text>
          <View className={styles.inputWrap}>
            <Input
              type="digit"
              className={styles.inputValue}
              value={weighbridgeWeight}
              onInput={(e) => setWeighbridgeWeight(e.detail.value)}
              placeholder="重量kg"
            />
            <Text className={styles.inputUnit}>kg</Text>
          </View>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>过磅批次</Text>
          <Text className={styles.v}>{getNextBatchNo()}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>司磅员</Text>
          <Text className={styles.v}>{currentUser.name}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>理论重量(+0.5%)</Text>
          <Text className={styles.v}>{(curW * 1.005).toFixed(1)} kg</Text>
        </View>
      </View>

      <SectionHeader title={`历史检验记录 (${records.length})`} />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button
          className={styles.btnSecondary}
          onClick={() => {
            setSurfaceOxidation('pass');
            setOxidationDetail('表面光洁，无氧化斑');
            setResistivity('0.01720');
            setWeighbridgeWeight('2500');
            Taro.showToast({ title: '已重置默认值', icon: 'none' });
          }}
        >
          重置
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交检验报告</Button>
      </View>
    </ScrollView>
  );
};

export default InspectionDetailPage;
