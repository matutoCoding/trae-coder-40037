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

type BatchStatusFilter = 'all' | 'producing' | 'finished' | 'warning';
const BATCH_FILTERS: Array<{ k: BatchStatusFilter; l: string; icon: string }> = [
  { k: 'all', l: '全部', icon: '📋' },
  { k: 'producing', l: '生产中', icon: '⚡' },
  { k: 'finished', l: '已完成', icon: '✅' },
  { k: 'warning', l: '需关注', icon: '⚠️' }
];

const getBatchStatus = (trace: any): BatchStatusFilter => {
  if (!trace) return 'all';
  const nodes = Object.values(trace).filter(Boolean);
  const inspection = trace.inspection;
  const hasWarning =
    (trace.rolling && Math.abs(trace.rolling.diameterTolerance) > 0.05) ||
    (trace.inspection && trace.inspection.overallResult === 'fail') ||
    (trace.furnace && trace.furnace.liquidLevel < 70) ||
    (trace.pickling && trace.pickling.acidConcentration < 11.5) ||
    (trace.melting && trace.melting.meltingTemp < 1165) ||
    (trace.inspection && trace.inspection.overallResult === 'warning');
  if (inspection && inspection.overallResult === 'pass' && !hasWarning) return 'finished';
  if (nodes.length === 7 && (inspection?.overallResult === 'pass' || inspection?.overallResult === 'warning') && !hasWarning) return 'finished';
  if (hasWarning) return 'warning';
  if (nodes.length > 0 && nodes.length < 7) return 'producing';
  if (inspection?.overallResult === 'warning') return 'warning';
  return 'finished';
};

const BatchTracePage: React.FC = () => {
  const { records, currentBatchNos, getBatchTrace } = useProductionStore();
  const [searchInput, setSearchInput] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [appliedBatch, setAppliedBatch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('all');

  const filteredBatchNos = useMemo(() => {
    if (statusFilter === 'all') return currentBatchNos;
    return currentBatchNos.filter((b) => {
      const trace = getBatchTrace(b)[0];
      return getBatchStatus(trace) === statusFilter;
    });
  }, [currentBatchNos, statusFilter, getBatchTrace]);

  const activeBatch = appliedBatch || (filteredBatchNos.length > 0 ? filteredBatchNos[0] : '');

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
      traceData.furnace ||
      traceData.casting ||
      traceData.rolling ||
      traceData.pickling ||
      traceData.inspection;
    const lastRecord =
      traceData.inspection ||
      traceData.pickling ||
      traceData.rolling ||
      traceData.casting ||
      traceData.furnace ||
      traceData.melting ||
      traceData.feeding;
    const startTime = firstRecord?.createTime || '-';
    const endTime = lastRecord?.createTime || '-';
    const operator = firstRecord?.operator || '-';
    const shift = firstRecord?.shift ? shiftNameMap[firstRecord.shift] : '-';
    const result = traceData.inspection?.overallResult;

    let totalDurationStr = '-';
    if (startTime !== '-' && endTime !== '-' && startTime !== endTime) {
      const t1 = new Date(startTime).getTime();
      const t2 = new Date(endTime).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
        const diffMin = Math.floor((t2 - t1) / 60000);
        if (diffMin >= 60) {
          totalDurationStr = `${Math.floor(diffMin / 60)}h${diffMin % 60}min`;
        } else {
          totalDurationStr = `${diffMin}分钟`;
        }
      }
    }
    const batchStatus = getBatchStatus(traceData);
    const warnCount = [
      (traceData.rolling && Math.abs(traceData.rolling.diameterTolerance) > 0.05) ? 1 : 0,
      (traceData.inspection && traceData.inspection.overallResult === 'fail') ? 1 : 0,
      (traceData.furnace && traceData.furnace.liquidLevel < 70) ? 1 : 0,
      (traceData.pickling && traceData.pickling.acidConcentration < 11.5) ? 1 : 0,
      (traceData.melting && traceData.melting.meltingTemp < 1165) ? 1 : 0,
      (traceData.inspection && traceData.inspection.overallResult === 'warning') ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    return {
      startTime,
      endTime,
      operator,
      shift,
      result,
      totalWeight: traceData.inspection?.weighbridgeWeight || traceData.pickling?.coilWeight || 0,
      nodesDone: Object.values(traceData).filter(Boolean).length,
      totalDurationStr,
      batchStatus,
      warnCount,
      qualityConclusion: result === 'pass' ? '全部项目合格，可正常出厂'
        : result === 'warning' ? '部分项目需关注，建议复核后出厂'
        : result === 'fail' ? '存在不合格项，需返工处理'
        : '未完成检验，请关注后续工序'
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

      <View className={styles.batchFilter}>
        {BATCH_FILTERS.map((f) => {
          const count = statusFilter === f.k
            ? filteredBatchNos.length
            : currentBatchNos.filter((b) => {
                const trace = getBatchTrace(b)[0];
                return f.k === 'all' || getBatchStatus(trace) === f.k;
              }).length;
          return (
            <Text
              key={f.k}
              className={classnames(styles.filterItem, statusFilter === f.k && styles.filterActive)}
              onClick={() => {
                setStatusFilter(f.k);
                setAppliedBatch('');
                setSelectedBatch('');
              }}
            >
              {f.icon} {f.l} <Text style={{ fontSize: 11, opacity: 0.7 }}>({count})</Text>
            </Text>
          );
        })}
      </View>

      <View className={styles.batchList}>
        <Text className={styles.labelTag}>
          {statusFilter === 'all' ? '全部批次' : statusFilter === 'producing' ? '生产中批次' : statusFilter === 'finished' ? '已完成批次' : '需关注批次'}：
        </Text>
        {filteredBatchNos.length === 0 && (
          <Text className={styles.noBatchTip}>暂无匹配批次</Text>
        )}
        {filteredBatchNos.slice(0, 10).map((b) => (
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
                const prevRec = idx > 0 ? (traceData as any)[moduleInfo[idx - 1].key] : null;
                const hasData = !!rec;
                let status: 'done' | 'warn' | 'pending' = 'pending';
                if (hasData) {
                  status = 'done';
                  if (mod.key === 'rolling' && rec && Math.abs(rec.diameterTolerance) > 0.05) status = 'warn';
                  if (mod.key === 'inspection' && rec && rec.overallResult === 'fail') status = 'warn';
                  if (mod.key === 'furnace' && rec && rec.liquidLevel < 70) status = 'warn';
                  if (mod.key === 'pickling' && rec && rec.acidConcentration < 11.5) status = 'warn';
                  if (mod.key === 'melting' && rec && rec.meltingTemp < 1165) status = 'warn';
                }
                let durationStr = '';
                if (hasData && prevRec) {
                  const t1 = new Date(prevRec.createTime).getTime();
                  const t2 = new Date(rec.createTime).getTime();
                  if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
                    const diffMin = Math.floor((t2 - t1) / 60000);
                    if (diffMin >= 60) {
                      durationStr = `${Math.floor(diffMin / 60)}h${diffMin % 60}min`;
                    } else if (diffMin > 0) {
                      durationStr = `${diffMin}分钟`;
                    }
                  }
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
                            {durationStr && (
                              <Text style={{ color: status === 'warn' ? '#F59E0B' : '#6366F1', fontWeight: 600 }}>
                                ⏱ 上工序→本工序: {durationStr}
                              </Text>
                            )}
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
              <View className={styles.title}>📋 生产履历 · 质量结论</View>
              <View className={styles.conclusionRow}
                style={{
                  background: summaryInfo.result === 'fail' ? 'rgba(239,68,68,0.08)'
                    : summaryInfo.result === 'warning' || summaryInfo.warnCount > 0 ? 'rgba(245,158,11,0.08)'
                    : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${summaryInfo.result === 'fail' ? 'rgba(239,68,68,0.3)'
                    : summaryInfo.result === 'warning' || summaryInfo.warnCount > 0 ? 'rgba(245,158,11,0.3)'
                    : 'rgba(16,185,129,0.3)'}`
                }}
              >
                <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>
                    {summaryInfo.result === 'fail' ? '🚫'
                      : summaryInfo.result === 'warning' || summaryInfo.warnCount > 0 ? '⚠️'
                      : summaryInfo.nodesDone < 7 ? '⚡' : '✅'}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: summaryInfo.result === 'fail' ? '#EF4444'
                      : summaryInfo.result === 'warning' || summaryInfo.warnCount > 0 ? '#F59E0B'
                      : '#10B981'
                  }}>
                    {summaryInfo.qualityConclusion}
                  </Text>
                </View>
              </View>

              <View className={styles.sumRow}>
                <View className={styles.item}>
                  <View className={styles.v}>{summaryInfo.startTime.slice(5, 16)}</View>
                  <View className={styles.l}>开始时间</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}>{summaryInfo.endTime !== '-' ? summaryInfo.endTime.slice(5, 16) : '-'}</View>
                  <View className={styles.l}>结束时间</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v} style={{ color: '#6366F1', fontWeight: 600 }}>{summaryInfo.totalDurationStr}</View>
                  <View className={styles.l}>总耗时</View>
                </View>
              </View>
              <View className={styles.sumRow}>
                <View className={styles.item}>
                  <View className={styles.v}>{summaryInfo.totalWeight || '-'}</View>
                  <View className={styles.l}>成品重量(kg)</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}>{summaryInfo.nodesDone}/7</View>
                  <View className={styles.l}>工序进度</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}
                    style={{ color: summaryInfo.warnCount > 0 ? '#F59E0B' : '#10B981', fontWeight: 600 }}
                  >
                    {summaryInfo.warnCount > 0 ? `${summaryInfo.warnCount}项` : '无'}
                  </View>
                  <View className={styles.l}>异常节点</View>
                </View>
              </View>
              <View className={styles.sumRow}>
                <View className={styles.item} style={{ alignItems: 'flex-start' }}>
                  <View className={styles.v} style={{ fontSize: 13 }}>{summaryInfo.operator}</View>
                  <View className={styles.l}>首工序操作人</View>
                </View>
                <View className={styles.item} style={{ alignItems: 'flex-start' }}>
                  <View className={styles.v} style={{ fontSize: 13 }}>{summaryInfo.shift}</View>
                  <View className={styles.l}>所属班次</View>
                </View>
                <View className={styles.item} style={{ alignItems: 'flex-start' }}>
                  <View className={styles.v} style={{ fontSize: 13, color: summaryInfo.result === 'fail' ? '#EF4444' : summaryInfo.result === 'warning' ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                    {summaryInfo.result ? qualityNameMap[summaryInfo.result]?.text : '生产中'}
                  </View>
                  <View className={styles.l}>最终质量</View>
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
