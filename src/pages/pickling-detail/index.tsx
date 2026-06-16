import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore } from '@/store/production';
import { currentUser } from '@/data/mockData';

const COILER_OPTIONS = ['1#卷取机', '2#卷取机'];
const ACID_OPTIONS = [11.5, 12.0, 12.5, 13.0, 13.5, 14.0];
const WEIGHT_OPTIONS = [2450, 2500, 2550, 2600, 2650];

const PicklingDetailPage: React.FC = () => {
  const records = useProductionStore((s) => s.records.pickling);
  const moduleStatus = useProductionStore((s) => s.moduleStatus.find((m) => m.key === 'pickling'));
  const addPicklingRecord = useProductionStore((s) => s.addPicklingRecord);
  const getNextBatchNo = useProductionStore((s) => s.getNextBatchNo);
  const currentBatchNos = useProductionStore((s) => s.currentBatchNos);

  const last = records[0];

  const [isNewBatch, setIsNewBatch] = useState(true);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>('');
  const [coilerNo, setCoilerNo] = useState<string>(COILER_OPTIONS[0]);
  const [acidConcentration, setAcidConcentration] = useState<string>('12.5');
  const [coilWeight, setCoilWeight] = useState<string>('2550');

  const finalBatchNo = isNewBatch ? getNextBatchNo() : selectedBatchNo;

  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return records.filter((r) => r.createTime.startsWith(today));
  }, [records]);

  const totalWeight = useMemo(() => {
    return todayRecords.reduce((s, r) => s + r.coilWeight, 0);
  }, [todayRecords]);

  const acidNum = parseFloat(acidConcentration) || 0;
  const acidWarn = acidNum < 12.0;

  const handleSubmit = () => {
    const ac = parseFloat(acidConcentration);
    const cw = parseFloat(coilWeight);
    if (isNaN(ac) || isNaN(cw)) {
      Taro.showToast({ title: '请填写完整参数', icon: 'none' });
      return;
    }
    if (!isNewBatch && !selectedBatchNo) {
      Taro.showToast({ title: '请选择或生成批次号', icon: 'none' });
      return;
    }
    addPicklingRecord({
      batchNo: finalBatchNo,
      coilerNo,
      acidConcentration: ac,
      coilWeight: cw,
      acidTemp: 40 + Math.floor(Math.random() * 8),
      picklingSpeed: Number((6.0 + Math.random() * 1.2).toFixed(1)),
      passivationTime: 12 + Math.floor(Math.random() * 8),
      coilDiameter: 1200 + Math.floor(Math.random() * 100)
    });
    Taro.showToast({ title: '成圈记录已提交', icon: 'success' });
  };

  const recordList: ListItem[] = records.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.operator,
    statusType: r.acidConcentration < 12.0 ? 'warning' : 'pass',
    statusText: r.acidConcentration < 12.0 ? '酸浓偏低' : '已完成',
    data: [
      { label: '卷重', value: `${r.coilWeight} kg` },
      { label: '酸浓', value: `${r.acidConcentration}%` }
    ]
  }));

  const curW = parseFloat(coilWeight) || last.coilWeight;

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>酸洗成圈</Text>
        <Text className={styles.desc}>酸洗钝化 · 卷取成圈 · {coilerNo}</Text>
        <View className={styles.stats}>
          <View className={styles.statBox}>
            <Text className={styles.v} style={{ color: acidWarn ? '#FCA5A5' : '#fff' }}>
              {acidConcentration}
            </Text>
            <Text className={styles.l}>录入酸浓度 %</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{todayRecords.length}</Text>
            <Text className={styles.l}>今日成圈数</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{(totalWeight / 1000).toFixed(1)}</Text>
            <Text className={styles.l}>今日总重量 t</Text>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatusBadge
          type={moduleStatus?.status === 'warning' ? 'warning' : 'running'}
          text={moduleStatus?.status === 'warning' ? '注意补酸' : '酸洗系统运行正常'}
        />
        {acidWarn && <StatusBadge type="warning" text="当前酸浓度偏低" />}
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
          <Text>现场录入 · 新增成圈记录</Text>
        </View>
        <View className={styles.dataList}>
          <View className={styles.item}>
            <Text className={styles.label}>卷取机号</Text>
            <View className={styles.chipRowNoPad}>
              {COILER_OPTIONS.map((v) => (
                <View
                  key={v}
                  className={`${styles.chip} ${coilerNo === v ? styles.chipActive : ''}`}
                  onClick={() => setCoilerNo(v)}
                >
                  <Text>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>酸液浓度</Text>
            <View className={styles.inputWrap}>
              <Input
                type="digit"
                className={styles.inputValue}
                value={acidConcentration}
                onInput={(e) => setAcidConcentration(e.detail.value)}
                placeholder="酸浓度"
              />
              <Text className={styles.inputUnit}>%</Text>
            </View>
          </View>
          <View className={styles.chipRow}>
            {ACID_OPTIONS.map((v) => (
              <View
                key={v}
                className={`${styles.chip} ${acidConcentration === String(v) ? styles.chipActive : ''}`}
                onClick={() => setAcidConcentration(String(v))}
              >
                <Text>{v}%</Text>
              </View>
            ))}
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>单卷重量</Text>
            <View className={styles.inputWrap}>
              <Input
                type="digit"
                className={styles.inputValue}
                value={coilWeight}
                onInput={(e) => setCoilWeight(e.detail.value)}
                placeholder="卷重"
              />
              <Text className={styles.inputUnit}>kg</Text>
            </View>
          </View>
          <View className={styles.chipRow}>
            {WEIGHT_OPTIONS.map((v) => (
              <View
                key={v}
                className={`${styles.chip} ${coilWeight === String(v) ? styles.chipActive : ''}`}
                onClick={() => setCoilWeight(String(v))}
              >
                <Text>{v}kg</Text>
              </View>
            ))}
          </View>

          <View className={styles.item}>
            <Text className={styles.label}>批次号(自动)</Text>
            <Text className={`${styles.value} ${styles.hl}`}>{finalBatchNo}</Text>
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
          <Text>成圈信息预览</Text>
        </View>
        <View className={styles.coilVisual}>
          <View className={styles.coilCircle}>
            <View className={styles.coilInner}></View>
          </View>
          <View className={styles.coilInfo}>
            <Text className={styles.weight}>{curW}</Text>
            <Text className={styles.unit}> kg / 卷</Text>
            <View className={styles.meta}>
              <Text>卷径 Φ1250mm · {coilerNo}</Text>
            </View>
            <View className={styles.meta}>
              <Text>操作人员: {currentUser.name}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>酸洗钝化参数(最新)</Text>
        </View>
        <View className={styles.paramGrid}>
          <View className={styles.paramBox}>
            <Text className={styles.v} style={{ color: last.acidConcentration < 12 ? '#F59E0B' : undefined }}>
              {last.acidConcentration}%
            </Text>
            <Text className={styles.l}>酸液浓度</Text>
            <Text className={styles.t}>标准 12~15%</Text>
          </View>
          <View className={styles.paramBox}>
            <Text className={styles.v}>{last.acidTemp}℃</Text>
            <Text className={styles.l}>酸液温度</Text>
            <Text className={styles.t}>标准 40~45℃</Text>
          </View>
          <View className={styles.paramBox}>
            <Text className={styles.v}>{last.picklingSpeed}</Text>
            <Text className={styles.l}>酸洗速度 m/min</Text>
            <Text className={styles.t}>标准 6~7 m/min</Text>
          </View>
          <View className={styles.paramBox}>
            <Text className={styles.v}>{last.passivationTime}s</Text>
            <Text className={styles.l}>钝化时间</Text>
            <Text className={styles.t}>标准 12~18 s</Text>
          </View>
        </View>
      </View>

      <SectionHeader title={`历史成圈记录 (${records.length})`} />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button
          className={styles.btnSecondary}
          onClick={() => {
            setCoilerNo(COILER_OPTIONS[0]);
            setAcidConcentration('12.5');
            setCoilWeight('2550');
            Taro.showToast({ title: '已重置默认值', icon: 'none' });
          }}
        >
          重置
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交成圈记录</Button>
      </View>
    </ScrollView>
  );
};

export default PicklingDetailPage;
