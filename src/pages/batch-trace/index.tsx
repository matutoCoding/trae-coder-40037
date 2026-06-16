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

    const durations: Array<{ key: string; label: string; minutes: number; rec: any }> = [];
    let prevTime: number | null = null;
    moduleInfo.forEach((mod) => {
      const rec = (traceData as any)[mod.key];
      if (rec) {
        const t = new Date(rec.createTime).getTime();
        if (prevTime !== null && t > prevTime) {
          durations.push({ key: mod.key, label: mod.label, minutes: Math.floor((t - prevTime) / 60000), rec });
        } else if (prevTime === null) {
          durations.push({ key: mod.key, label: mod.label, minutes: 0, rec });
        }
        prevTime = t;
      }
    });
    const sortedDurations = [...durations].sort((a, b) => b.minutes - a.minutes);
    const slowestNode = sortedDurations.find((d) => d.minutes > 0) || null;

    const deviations: Array<{ module: string; param: string; current: string; target: string; level: 'high' | 'mid' | 'low'; suggestion: string }> = [];
    if (traceData.melting && traceData.melting.meltingTemp < 1170) {
      const diff = 1170 - traceData.melting.meltingTemp;
      deviations.push({
        module: '竖炉熔化',
        param: '熔化温度',
        current: `${traceData.melting.meltingTemp}℃`,
        target: '≥1170℃',
        level: diff > 10 ? 'high' : 'mid',
        suggestion: diff > 10 ? '立即检查燃烧器阀门和燃料压力，必要时降低浇铸速度补温' : '观察15分钟后复测，若继续下降联系调火工'
      });
    }
    if (traceData.furnace && traceData.furnace.liquidLevel < 75) {
      const diff = 75 - traceData.furnace.liquidLevel;
      deviations.push({
        module: '保温炉',
        param: '铜液液位',
        current: `${traceData.furnace.liquidLevel}%`,
        target: '≥75%',
        level: diff > 10 ? 'high' : 'mid',
        suggestion: diff > 10 ? '申请补料并通知上工序加快出铜节奏' : '现场确认液位计是否准确，加强巡检频次'
      });
    }
    if (traceData.casting && traceData.casting.castingWheelSpeed < 3.0) {
      deviations.push({
        module: '连铸成型',
        param: '浇铸速度',
        current: `${traceData.casting.castingWheelSpeed}m/min`,
        target: '3.0~4.5m/min',
        level: 'low',
        suggestion: '结合铜液温度评估是否可逐步提速，避免产能浪费'
      });
    }
    if (traceData.rolling && Math.abs(traceData.rolling.diameterTolerance) > 0.03) {
      const tol = Math.abs(traceData.rolling.diameterTolerance);
      deviations.push({
        module: '连轧拉拔',
        param: '直径偏差',
        current: `${traceData.rolling.diameterTolerance > 0 ? '+' : ''}${traceData.rolling.diameterTolerance}mm`,
        target: '±0.03mm',
        level: tol > 0.06 ? 'high' : 'mid',
        suggestion: tol > 0.06 ? '立即停机检查轧辊磨损，重新对中调整' : '调整减径模冷却水温度，30分钟后复测'
      });
    }
    if (traceData.pickling && traceData.pickling.acidConcentration < 12.0) {
      const diff = 12.0 - traceData.pickling.acidConcentration;
      deviations.push({
        module: '酸洗成圈',
        param: '硫酸浓度',
        current: `${traceData.pickling.acidConcentration}%`,
        target: '12.0%~14.0%',
        level: diff > 1.0 ? 'high' : 'low',
        suggestion: diff > 1.0 ? '及时补充浓硫酸并循环搅拌，检测钝化效果' : '1小时后复测浓度，观察铜杆表面是否有氧化斑'
      });
    }
    if (traceData.inspection && traceData.inspection.overallResult !== 'pass') {
      const isFail = traceData.inspection.overallResult === 'fail';
      deviations.push({
        module: '成品检验',
        param: '综合判定',
        current: traceData.inspection.overallResult === 'warning' ? '需关注' : '不合格',
        target: '合格',
        level: isFail ? 'high' : 'mid',
        suggestion: isFail ? '立即隔离本批次，启动返工/报废评审流程' : '建议复检氧化等级和电阻率，由班长签字确认后放行'
      });
    }
    if (traceData.inspection && traceData.inspection.resistivity > 0.01724 * 1.01) {
      const exceed = (traceData.inspection.resistivity / (0.01724 * 1.01) - 1) * 100;
      deviations.push({
        module: '成品检验',
        param: '电阻率',
        current: Number(traceData.inspection.resistivity).toFixed(5),
        target: `≤${(0.01724 * 1.01).toFixed(5)} Ω·mm²/m`,
        level: exceed > 2 ? 'high' : 'low',
        suggestion: '追溯上料批次，确认阴极铜原料等级及杂质含量'
      });
    }

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
        : '未完成检验，请关注后续工序',
      slowestNode: slowestNode ? { ...slowestNode, labelShort: slowestNode.label } : null,
      deviationCount: deviations.length,
      highDeviationCount: deviations.filter((d) => d.level === 'high').length,
      deviations,
      actionSuggestions: [
        ...deviations.filter((d) => d.level === 'high').map((d) => `【${d.module}】${d.suggestion}`),
        ...deviations.filter((d) => d.level === 'mid').map((d) => `【${d.module}】${d.suggestion}`),
        ...deviations.filter((d) => d.level === 'low').map((d) => `【${d.module}】${d.suggestion}`),
        ...(slowestNode && slowestNode.minutes > 45 ? [`【流程效率】${slowestNode.label}耗时${slowestNode.minutes}分钟偏长，建议分析瓶颈并优化`] : []),
        ...(deviations.length === 0 && (!slowestNode || slowestNode.minutes <= 45) ? ['本批次生产稳定，所有关键参数均在目标范围内，继续保持当前工艺条件'] : [])
      ]
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
        {traceData && summaryInfo && (() => {
          const s = summaryInfo;
          const isFail = s.result === 'fail';
          const isWarn = s.result === 'warning' || s.warnCount > 0;
          const vBgRed = 'rgba(239,68,68,0.08)';
          const vBgBlue = 'rgba(99,102,241,0.08)';
          const concBg = isFail ? vBgRed : isWarn ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';
          const concBd = isFail ? 'rgba(239,68,68,0.3)' : isWarn ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)';
          const concColor = isFail ? '#EF4444' : isWarn ? '#F59E0B' : '#10B981';
          const concIcon = isFail ? '🚫' : isWarn ? '⚠️' : s.nodesDone < 7 ? '⚡' : '✅';
          const qualityColor = s.result === 'fail' ? '#EF4444' : s.result === 'warning' ? '#F59E0B' : '#10B981';
          const vColorHi = s.highDeviationCount > 0 ? '#EF4444' : '#10B981';
          const vColorAll = s.deviationCount > 0 ? '#F59E0B' : '#10B981';
          return (
          <>
            <View className={styles.traceTimeline}>
              <View className={styles.traceHeader}>
                <Text className={styles.batchTitle}>批次 {activeBatch}</Text>
                {s.result ? (
                  <StatusBadge
                    type={s.result as any}
                    text={qualityNameMap[s.result]?.text || ''}
                  />
                ) : (
                  <View className={styles.overallStatus} style={{ background: 'rgba(107,114,128,0.1)', color: '#6B7280' }}>
                    生产中 {s.nodesDone}/7
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
                style={{ background: concBg, border: `1px solid ${concBd}` }}
              >
                <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{concIcon}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: concColor }}>
                    {s.qualityConclusion}
                  </Text>
                </View>
              </View>

              <View className={styles.sumRow}>
                <View className={styles.item}>
                  <View className={styles.v}>{s.startTime.slice(5, 16)}</View>
                  <View className={styles.l}>开始时间</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}>{s.endTime !== '-' ? s.endTime.slice(5, 16) : '-'}</View>
                  <View className={styles.l}>结束时间</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v} style={{ color: '#6366F1', fontWeight: 600 }}>{s.totalDurationStr}</View>
                  <View className={styles.l}>总耗时</View>
                </View>
              </View>
              <View className={styles.sumRow}>
                <View className={styles.item}>
                  <View className={styles.v}>{s.totalWeight || '-'}</View>
                  <View className={styles.l}>成品重量(kg)</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}>{s.nodesDone}/7</View>
                  <View className={styles.l}>工序进度</View>
                </View>
                <View className={styles.item}>
                  <View className={styles.v}
                    style={{ color: s.warnCount > 0 ? '#F59E0B' : '#10B981', fontWeight: 600 }}
                  >
                    {s.warnCount > 0 ? `${s.warnCount}项` : '无'}
                  </View>
                  <View className={styles.l}>异常节点</View>
                </View>
              </View>
              <View className={styles.sumRow}>
                <View className={styles.item} style={{ alignItems: 'flex-start' }}>
                  <View className={styles.v} style={{ fontSize: 13 }}>{s.operator}</View>
                  <View className={styles.l}>首工序操作人</View>
                </View>
                <View className={styles.item} style={{ alignItems: 'flex-start' }}>
                  <View className={styles.v} style={{ fontSize: 13 }}>{s.shift}</View>
                  <View className={styles.l}>所属班次</View>
                </View>
                <View className={styles.item} style={{ alignItems: 'flex-start' }}>
                  <View className={styles.v} style={{ fontSize: 13, color: qualityColor, fontWeight: 600 }}>
                    {s.result ? qualityNameMap[s.result]?.text : '生产中'}
                  </View>
                  <View className={styles.l}>最终质量</View>
                </View>
              </View>
            </View>

            <View className={styles.deviationCard}>
              <View className={styles.title}>⚡ 偏差分析 · 智能诊断</View>

              <View className={styles.deviationHeader}>
                <View style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <View style={{ flex: 1, minWidth: '45%', background: vBgRed, borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>高危偏差</Text>
                    <Text style={{ fontSize: 20, fontWeight: 700, color: vColorHi }}>
                      {s.highDeviationCount}项
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: '45%', background: vBgBlue, borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>总偏差项</Text>
                    <Text style={{ fontSize: 20, fontWeight: 700, color: vColorAll }}>
                      {s.deviationCount}项
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: '45%', background: vBgBlue, borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>最长工序</Text>
                    <Text style={{ fontSize: 15, fontWeight: 700, color: '#6366F1' }}>
                      {s.slowestNode ? `${s.slowestNode.labelShort}` : '-'}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>{s.slowestNode ? `${s.slowestNode.minutes}分钟` : ''}</Text>
                  </View>
                </View>
              </View>

              {s.slowestNode && s.slowestNode.minutes > 30 && (
                <View className={styles.deviationItem} style={{ borderLeft: '3px solid #6366F1', marginBottom: 10 }}>
                  <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: 600, color: '#6366F1' }}>
                        ⏱ 工序耗时预警 · {s.slowestNode.labelShort}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#475569' }}>
                        上工序到本工序耗时 {s.slowestNode.minutes}分钟，超过30分钟阈值
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {s.deviations.map((d, i) => {
                const lc = d.level === 'high' ? '#EF4444' : d.level === 'mid' ? '#F59E0B' : '#0EA5E9';
                const icon = d.level === 'high' ? '🔴 ' : d.level === 'mid' ? '🟡 ' : '🔵 ';
                const valColor = d.level === 'high' ? '#EF4444' : '#475569';
                return (
                  <View key={i} className={styles.deviationItem}
                    style={{ borderLeft: `3px solid ${lc}` }}>
                    <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 13, fontWeight: 600, color: lc }}>
                          {icon}
                          【{d.module}】{d.param}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#475569', display: 'block', marginTop: 2 }}>
                          当前值: <Text style={{ fontWeight: 600, color: valColor }}>{d.current}</Text>
                          {'  '}
                          目标: <Text style={{ fontWeight: 500, color: '#10B981' }}>{d.target}</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 4, lineHeight: 1.5 }}>
                          💡 {d.suggestion}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                  ✅ 处理建议清单：
                </Text>
                {s.actionSuggestions.map((act, i) => (
                  <Text key={i} style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4, paddingLeft: 12, lineHeight: 1.6 }}>
                    {i + 1}. {act}
                  </Text>
                ))}
              </View>
            </View>
          </>
          );
        })()}

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
