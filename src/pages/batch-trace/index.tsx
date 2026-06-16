import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore } from '@/store/production';
import { qualityNameMap, shiftNameMap } from '@/data/mockData';
import classnames from 'classnames';

const moduleInfo: Array<{
  key: string;
  label: string;
  short: string;
  paramMap: Record<string, { label: string; suffix?: string; format?: (v: any) => string }>;
}> = [
  {
    key: 'feeding',
    label: '阴极铜投料',
    short: '投',
    paramMap: {
      cathodeCopperWeight: { label: '投料重量', suffix: ' kg' },
      materialGrade: { label: '原料等级' },
      supplier: { label: '供应商' }
    }
  },
  {
    key: 'melting',
    label: '竖炉熔化',
    short: '熔',
    paramMap: {
      furnaceNo: { label: '炉号' },
      meltingTemp: { label: '熔化温度', suffix: ' ℃' },
      fuelConsumption: { label: '燃料消耗', suffix: ' m³' },
      meltingDuration: { label: '熔化时长', suffix: ' 分钟' }
    }
  },
  {
    key: 'furnace',
    label: '保温炉',
    short: '保',
    paramMap: {
      liquidLevel: { label: '液位', suffix: '%' },
      holdingTemp: { label: '保温温度', suffix: ' ℃' }
    }
  },
  {
    key: 'casting',
    label: '连铸成型',
    short: '铸',
    paramMap: {
      castingWheelSpeed: { label: '浇铸速度', suffix: ' m/min' },
      castingTemp: { label: '浇铸温度', suffix: ' ℃' },
      billetTemp: { label: '铸坯温度', suffix: ' ℃' },
      billetSize: { label: '铸坯尺寸' }
    }
  },
  {
    key: 'rolling',
    label: '连轧拉拔',
    short: '轧',
    paramMap: {
      millNo: { label: '轧机' },
      rollingSpeed: { label: '轧制速度', suffix: ' m/s' },
      rodDiameter: { label: '铜杆直径', suffix: ' mm' },
      diameterTolerance: { label: '直径偏差', suffix: ' mm' },
      rollingForce: { label: '轧制力', suffix: ' kN' }
    }
  },
  {
    key: 'pickling',
    label: '酸洗成圈',
    short: '圈',
    paramMap: {
      acidConcentration: { label: '酸浓度', suffix: '%' },
      acidTemp: { label: '酸温', suffix: ' ℃' },
      coilWeight: { label: '卷重', suffix: ' kg' },
      coilDiameter: { label: '卷径', suffix: ' mm' }
    }
  },
  {
    key: 'inspection',
    label: '成品检验',
    short: '检',
    paramMap: {
      surfaceOxidation: {
        label: '氧化检查',
        format: (v) => (qualityNameMap[v] ? qualityNameMap[v].text : v)
      },
      resistivity: { label: '电阻率', format: (v) => Number(v).toFixed(5) },
      weighbridgeWeight: { label: '过磅重量', suffix: ' kg' },
      overallResult: {
        label: '综合判定',
        format: (v) => (qualityNameMap[v] ? qualityNameMap[v].text : v)
      }
    }
  }
];

const BatchTracePage: React.FC = () => {
  const { records, currentBatchNos, getBatchTrace } = useProductionStore();
  const [searchInput, setSearchInput] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [appliedBatch, setAppliedBatch] = useState<string>('');

  const activeBatch = appliedBatch || (currentBatchNos.length > 0 ? currentBatchNos[0] : '');

  const traceData = useMemo(() => {
    if (!activeBatch) return null;
    return getBatchTrace(activeBatch)[0];
  }, [activeBatch, records, getBatchTrace]);

  const handleSearch = () => {
    const query = searchInput.trim();
    if (!query) {
      Taro.showToast({ title: '请输入批次号', icon: 'none' });
      return;
    }
    const found = currentBatchNos.find((b) => b.toUpperCase().includes(query.toUpperCase()));
    if (found) {
      setAppliedBatch(found);
      setSelectedBatch(found);
      Taro.showToast({ title: '已定位批次', icon: 'success' });
    } else {
      Taro.showToast({ title: '未找到该批次', icon: 'none' });
    }
  };

  const handleSelectBatch = (b: string) => {
    setSelectedBatch(b);
    setAppliedBatch(b);
  };

  const summaryInfo = useMemo(() => {
    if (!traceData) return null;
    const firstRecord =
      traceData.feeding ||
      traceData.melting ||
      traceData.casting ||
      traceData.rolling ||
      traceData.pickling ||
      traceData.inspection;
    const startTime = firstRecord?.createTime || '-';
    const operator = firstRecord?.operator || '-';
    const shift = firstRecord?.shift ? shiftNameMap[firstRecord.shift] : '-';
    const result = traceData.inspection?.overallResult;
    return {
      startTime,
      operator,
      shift,
      result,
      totalWeight: traceData.inspection?.weighbridgeWeight || traceData.pickling?.coilWeight || 0,
      nodesDone: Object.values(traceData).filter(Boolean).length
    };
  }, [traceData]);

  return (
    <View className={styles.page}>
      <View className={styles.searchArea}>
        <Text className={styles.title}>批次流程追踪</Text>
        <Text className={styles.sub}>输入批次号查看完整生产流程</Text>
        <View className={styles.searchBox}>
          <View className={styles.inputWrap}>
            <Text className={styles.icon}>🔍</Text>
            <Input
              className={styles.input}
              placeholder="请输入批次号，如 B2026061701"
              value={searchInput}
              onInput={(e) => setSearchInput((e as any).detail.value)}
              confirmType="search"
              onConfirm={handleSearch}
            />
          </View>
          <Button className={styles.searchBtn} onClick={handleSearch}>
            查询
          </Button>
        </View>
      </View>

      <View className={styles.batchList}>
        <Text className={styles.labelTag}>最近批次：</Text>
        {currentBatchNos.slice(0, 8).map((b) => (
          <Text
            key={b}
            className={classnames(styles.tag, (selectedBatch === b || (!selectedBatch && b === activeBatch)) && styles.active)}
            onClick={() => handleSelectBatch(b)}
          >
            {b.slice(-4)}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        {traceData && summaryInfo && (
          <>
            <View className={styles.traceTimeline}>
              <View className={styles.traceHeader}>
                <Text className={styles.batchTitle}>批次 {activeBatch}</Text>
                {summaryInfo.result ? (
                  <StatusBadge
                    type={summaryInfo.result as any}
                    text={qualityNameMap[summaryInfo.result]?.text || ''}
                  />
                ) : (
                  <View className={styles.overallStatus} style={{ background: 'rgba(107,114,128,0.1)', color: '#6B7280' }}>
                    生产中 {summaryInfo.nodesDone}/7
                  </View>
                )}
              </View>

              {moduleInfo.map((mod, idx) => {
                const rec = (traceData as any)[mod.key];
                const hasData = !!rec;
                let status: 'done' | 'warn' | 'pending' = 'pending';
                if (hasData) {
                  status = 'done';
                  if (mod.key === 'rolling' && rec && Math.abs(rec.diameterTolerance) > 0.05) status = 'warn';
                  if (mod.key === 'inspection' && rec && rec.overallResult !== 'pass') status = 'warn';
                  if (mod.key === 'furnace' && rec && rec.liquidLevel < 75) status = 'warn';
                }
                const params = mod.paramMap;
                const paramEntries = Object.keys(params)
                  .filter((k) => rec && rec[k] !== undefined && rec[k] !== null && rec[k] !== '')
                  .map((k) => ({
                    label: params[k].label,
                    value: params[k].format
                      ? params[k].format!(rec[k])
                      : `${rec[k]}${params[k].suffix || ''}`
                  }));

                return (
                  <View className={styles.timelineNode} key={mod.key}>
                    <View className={classnames(styles.nodeMarker, styles[status])}>
                      {mod.short}
                    </View>
                    <View className={styles.line}></View>
                    <View className={styles.nodeContent}>
                      <View className={styles.nodeHead}>
                        <Text className={styles.nodeName}>{mod.label}</Text>
                        <StatusBadge
                          type={hasData ? (status === 'warn' ? 'warning' : 'pass') : 'pending'}
                          text={hasData ? (status === 'warn' ? '有偏差' : '已完成') : '未开始'}
                          showDot={false}
                        />
                      </View>
                      <View className={styles.nodeInfo}>
                        {hasData ? (
                          <>
                            <Text>🕐 {rec.createTime?.slice(5) || '-'}</Text>
                            <Text>👤 {rec.operator || '-'}</Text>
                            {rec.shift && <Text>🗓 {shiftNameMap[rec.shift] || ''}</Text>}
                          </>
                        ) : (
                          <Text>等待上一工序完成</Text>
                        )}
                      </View>
                      {hasData && paramEntries.length > 0 && (
                        <View className={styles.params}>
                          {paramEntries.map((p, i) => (
                            <View className={styles.pItem} key={i}>
                              <Text className={styles.pLabel}>{p.label}：</Text>
                              <Text className={styles.pValue}>{p.value}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <View className={styles.summaryCard}>
              <View className={styles.title}>批次信息汇总</View>
              <View className={styles.sumRow}>
                <View className={styles.item}>
                  <View className={styles.v}>{summaryInfo.startTime.slice(5, 16)}</View>
                  <View className={styles.l}>开始时间</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}>{summaryInfo.totalWeight || '-'}</View>
                  <View className={styles.l}>成品重量(kg)</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}>{summaryInfo.operator}</View>
                  <View className={styles.l}>首工序操作人</View>
                </View>
              </View>
            </View>
          </>
        )}

        {!traceData && (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📦</Text>
            <Text>暂无该批次的生产记录</Text>
            <View className={styles.emptyTip}>
              <Text>提示：可通过最近批次标签快速选择</Text>
              <Text>{'\n'}批次号格式为 B + 年月日 + 序号</Text>
            </View>
          </View>
        )}

        <View style={{ height: 60 }}></View>
      </ScrollView>
    </View>
  );
};

export default BatchTracePage;
