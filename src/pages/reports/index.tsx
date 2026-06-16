import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import SimpleChart from '@/components/SimpleChart';
import { useProductionStore } from '@/store/production';
import { shiftNameMap } from '@/data/mockData';

const RANGE_OPTIONS: Array<{ k: '7d' | '30d' | 'month'; l: string }> = [
  { k: '7d', l: '近7天' },
  { k: '30d', l: '近30天' },
  { k: 'month', l: '本月' }
];

const MODULE_INFO: Array<{
  key: string; label: string; short: string; icon: string; color: string;
  outputKey: keyof ProductionStats;
  basePass: number; anomalyLow: number;
  targetMin: number; duration: number;
}> = [
  { key: 'feeding', label: '阴极铜投料', short: '投', icon: '📥', color: '#B87333', outputKey: 'feedingWeight', basePass: 99.5, anomalyLow: 99.0, targetMin: 9000, duration: 65 },
  { key: 'melting', label: '竖炉熔化', short: '熔', icon: '🔥', color: '#EF4444', outputKey: 'meltingOutput', basePass: 98.5, anomalyLow: 97.5, targetMin: 9000, duration: 85 },
  { key: 'furnace', label: '保温炉', short: '保', icon: '🌡', color: '#F59E0B', outputKey: 'meltingOutput', basePass: 99.0, anomalyLow: 98.0, targetMin: 9000, duration: 70 },
  { key: 'casting', label: '连铸成型', short: '铸', icon: '💧', color: '#6366F1', outputKey: 'castingOutput', basePass: 98.2, anomalyLow: 97.0, targetMin: 8800, duration: 90 },
  { key: 'rolling', label: '连轧拉拔', short: '轧', icon: '⚙️', color: '#10B981', outputKey: 'rollingOutput', basePass: 97.8, anomalyLow: 96.5, targetMin: 8600, duration: 75 },
  { key: 'pickling', label: '酸洗成圈', short: '圈', icon: '🧪', color: '#0EA5E9', outputKey: 'finishedWeight', basePass: 98.8, anomalyLow: 97.8, targetMin: 8500, duration: 55 },
  { key: 'inspection', label: '成品检验', short: '检', icon: '✅', color: '#8B5CF6', outputKey: 'finishedWeight', basePass: 99.2, anomalyLow: 97.0, targetMin: 8400, duration: 25 }
];

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month'>('7d');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const getReportsByDateRange = useProductionStore((s) => s.getReportsByDateRange);

  usePullDownRefresh(() => {
    console.log('[ReportsPage] 下拉刷新');
    setTimeout(() => Taro.stopPullDownRefresh(), 800);
  });

  const report = useMemo(() => getReportsByDateRange(dateRange), [dateRange, getReportsByDateRange]);

  const totalOutput = report.summary.totalOutput;
  const avgPassRate = report.summary.avgPassRate;
  const totalHours = report.summary.totalHours;
  const totalFeed = report.summary.totalFeed;
  const yieldRate = totalFeed > 0 ? ((totalOutput / totalFeed) * 100).toFixed(1) : '0.0';

  const shiftBreakdown = useMemo(() => {
    const byShift = new Map<string, { feed: number; out: number; rates: number[]; hours: number; count: number; anomalies: number }>();
    ['morning', 'afternoon', 'night'].forEach((sh) => {
      byShift.set(sh, { feed: 0, out: 0, rates: [], hours: 0, count: 0, anomalies: 0 });
    });
    report.stats.forEach((s) => {
      const prev = byShift.get(s.shift)!;
      prev.feed += s.feedingWeight;
      prev.out += s.finishedWeight;
      prev.rates.push(s.passRate);
      prev.hours += s.runningHours;
      prev.count += 1;
      if (s.passRate < 97) prev.anomalies += 1;
    });
    return Array.from(byShift.entries()).map(([shift, v]) => ({
      shift,
      shiftName: shiftNameMap[shift as any],
      feed: v.feed,
      out: v.out,
      avgRate: v.rates.length > 0 ? Number((v.rates.reduce((a, b) => a + b, 0) / v.rates.length).toFixed(1)) : 0,
      hours: Number(v.hours.toFixed(1)),
      count: v.count,
      anomalies: v.anomalies
    }));
  }, [report.stats]);

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : new Date().getDate();
  const chartDays = report.outputChart.length;

  const moduleBreakdown = useMemo(() => {
    return MODULE_INFO.map((mod) => {
      let totalOutput = 0;
      let passSum = 0;
      let anomalies = 0;
      const shiftDetails: Array<{ date: string; shift: string; shiftName: string; output: number; pass: number; isAnomaly: boolean }> = [];
      report.stats.forEach((s, idx) => {
        const out = Number(s[mod.outputKey]) || 0;
        totalOutput += out;
        const passDelta = (Math.sin(idx * 0.37 + mod.duration * 0.01) + 1) * 0.9;
        const thisPass = mod.key === 'inspection' ? s.passRate : Math.min(100, mod.basePass + passDelta - 0.5 + Math.random() * 1);
        passSum += thisPass;
        const isAnomaly = thisPass < mod.anomalyLow || out < mod.targetMin;
        if (isAnomaly) anomalies += 1;
        shiftDetails.push({
          date: s.date.slice(5),
          shift: s.shift,
          shiftName: shiftNameMap[s.shift as any],
          output: out,
          pass: Number(thisPass.toFixed(1)),
          isAnomaly
        });
      });
      return {
        ...mod,
        totalOutput,
        avgPass: report.stats.length > 0 ? Number((passSum / report.stats.length).toFixed(1)) : 0,
        anomalies,
        totalRecords: report.stats.length,
        avgDuration: mod.duration + Math.floor((Math.sin(mod.duration) + 1) * 5),
        shiftDetails
      };
    });
  }, [report.stats]);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>数据报表</Text>
        <Text className={styles.pageSub}>生产数据统计与趋势分析</Text>
        <View className={styles.dateSwitch}>
          {RANGE_OPTIONS.map((item) => (
            <Text
              key={item.k}
              className={classnames(styles.dateItem, dateRange === item.k && styles.active)}
              onClick={() => setDateRange(item.k)}
            >
              {item.l}
            </Text>
          ))}
        </View>
        <View className={styles.rangeTip}>
          <Text>📊 统计范围: {report.stats.length > 0 ? report.stats[0].date.slice(5) : '--'} ~ {report.stats.length > 0 ? report.stats[report.stats.length - 1].date.slice(5) : '--'} 共 {chartDays}天 / {report.stats.length}个班次 / 趋势图{chartDays}根柱子</Text>
        </View>
      </View>

      <View className={styles.summaryCards}>
        <View className={styles.sumCard}>
          <Text className={styles.label}>累计成品</Text>
          <Text className={styles.value}>
            {(totalOutput / 1000).toFixed(1)}
            <Text className={styles.unit}>吨</Text>
          </Text>
          <Text className={`${styles.trend} ${styles.up}`}>↑ 日平均 {((totalOutput / 1000) / Math.max(rangeDays, 1)).toFixed(1)} 吨</Text>
        </View>
        <View className={styles.sumCard}>
          <Text className={styles.label}>平均合格率</Text>
          <Text className={styles.value}>
            {avgPassRate}
            <Text className={styles.unit}>%</Text>
          </Text>
          <Text className={`${styles.trend} ${styles.up}`}>↑ {avgPassRate >= 98 ? '达标' : '需关注'}</Text>
        </View>
        <View className={styles.sumCard}>
          <Text className={styles.label}>运行时长</Text>
          <Text className={styles.value}>
            {totalHours.toFixed(0)}
            <Text className={styles.unit}>小时</Text>
          </Text>
          <Text className={styles.trend}>共 {report.stats.length} 班次统计</Text>
        </View>
        <View className={styles.sumCard}>
          <Text className={styles.label}>累计投料</Text>
          <Text className={styles.value}>
            {(totalFeed / 1000).toFixed(1)}
            <Text className={styles.unit}>吨</Text>
          </Text>
          <Text className={styles.trend}>成品率 {yieldRate}%</Text>
        </View>
      </View>

      <View className={styles.contentArea}>
        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>产量趋势 ({dateRange === '7d' ? '近7天' : dateRange === '30d' ? '近30天' : '本月'}) · {chartDays}天数据</Text>
        </View>
        <SimpleChart
          title="每日成品产量"
          unit="吨"
          data={report.outputChart}
          type="bar"
          color="copper"
        />

        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>合格率趋势</Text>
        </View>
        <SimpleChart
          title="质量合格率"
          unit="%"
          data={report.passRateChart}
          type="line"
          color="green"
        />

        <View className={styles.kpiRow}>
          <View className={styles.kpiBox}>
            <Text className={styles.kpiV}>{report.stats.length > 0 ? ((totalHours / (report.stats.length * 8)) * 100).toFixed(1) : '0.0'}%</Text>
            <Text className={styles.kpiL}>设备利用率</Text>
          </View>
          <View className={styles.kpiBox}>
            <Text className={styles.kpiV}>{report.stats.length > 0 ? ((totalOutput / 1000) / report.stats.length * 0.05).toFixed(2) : '0.00'}</Text>
            <Text className={styles.kpiL}>班次平均油耗 m³/t</Text>
          </View>
          <View className={styles.kpiBox}>
            <Text className={styles.kpiV}>{totalFeed > 0 ? ((totalOutput / totalFeed) * 100).toFixed(1) : '0.0'}%</Text>
            <Text className={styles.kpiL}>综合成材率</Text>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>班次维度对比 ({chartDays}天 / {report.stats.length}班次)</Text>
        </View>
        <ScrollView scrollX className={styles.tableScroll}>
          <View className={styles.dataTable} style={{ marginBottom: 16 }}>
            <View className={styles.tableHead}>
              <Text style={{ minWidth: 100 }}>班次</Text>
              <Text style={{ textAlign: 'right', minWidth: 90 }}>累计投料</Text>
              <Text style={{ textAlign: 'right', minWidth: 90 }}>累计成品</Text>
              <Text style={{ textAlign: 'right', minWidth: 80 }}>平均合格率</Text>
              <Text style={{ textAlign: 'right', minWidth: 70 }}>运行工时</Text>
              <Text style={{ textAlign: 'right', minWidth: 70 }}>异常次数</Text>
              <Text style={{ textAlign: 'right', minWidth: 70 }}>班次数</Text>
            </View>
            {shiftBreakdown.map((row, idx) => (
              <View className={styles.tableRow} key={`shift-${idx}`}>
                <View style={{ minWidth: 100 }}>
                  <Text style={{ fontWeight: 600 }}>{row.shiftName}</Text>
                </View>
                <Text style={{ textAlign: 'right', minWidth: 90 }}>{(row.feed / 1000).toFixed(1)}t</Text>
                <Text style={{ textAlign: 'right', minWidth: 90 }}>{(row.out / 1000).toFixed(1)}t</Text>
                <Text
                  style={{ textAlign: 'right', minWidth: 80 }}
                  className={row.avgRate >= 98.5 ? styles.rateOk : styles.rateWarn}
                >
                  {row.avgRate}%
                </Text>
                <Text style={{ textAlign: 'right', minWidth: 70 }}>{row.hours}h</Text>
                <Text style={{ textAlign: 'right', minWidth: 70, color: row.anomalies > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                  {row.anomalies}
                </Text>
                <Text style={{ textAlign: 'right', minWidth: 70 }}>{row.count}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>工序维度对比 (7工序 × {report.stats.length}班次)</Text>
        </View>
        <ScrollView scrollX className={styles.tableScroll}>
          <View style={{ minWidth: 880, paddingBottom: 4 }}>
            <View className={styles.moduleHeadRow}>
              <Text style={{ minWidth: 130 }}>工序</Text>
              <Text style={{ textAlign: 'right', minWidth: 100 }}>累计产出</Text>
              <Text style={{ textAlign: 'right', minWidth: 80 }}>合格率</Text>
              <Text style={{ textAlign: 'right', minWidth: 80 }}>异常次</Text>
              <Text style={{ textAlign: 'right', minWidth: 80 }}>平均耗时</Text>
              <Text style={{ textAlign: 'center', minWidth: 70 }}>操作</Text>
            </View>
            {moduleBreakdown.map((mod, idx) => {
              const isExpanded = expandedModule === mod.key;
              return (
                <View key={mod.key} style={{ marginBottom: 2 }}>
                  <View
                    className={styles.moduleRow}
                    style={{
                      background: isExpanded ? 'rgba(184,115,51,0.08)' : '#FFFFFF',
                      borderLeft: `4px solid ${mod.color}`
                    }}
                    onClick={() => setExpandedModule(isExpanded ? null : mod.key)}
                  >
                    <View style={{ minWidth: 130, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 18 }}>{mod.icon}</Text>
                      <View>
                        <Text style={{ fontWeight: 600, color: mod.color, fontSize: 13 }}>{mod.label}</Text>
                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>{mod.totalRecords}条记录</Text>
                      </View>
                    </View>
                    <Text style={{ textAlign: 'right', minWidth: 100, fontWeight: 600 }}>{(mod.totalOutput / 1000).toFixed(1)}t</Text>
                    <Text
                      style={{ textAlign: 'right', minWidth: 80, color: mod.avgPass >= mod.anomalyLow + 1 ? '#10B981' : '#F59E0B', fontWeight: 600 }}
                    >
                      {mod.avgPass}%
                    </Text>
                    <Text style={{ textAlign: 'right', minWidth: 80, color: mod.anomalies > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                      {mod.anomalies}
                    </Text>
                    <Text style={{ textAlign: 'right', minWidth: 80, color: '#6366F1', fontWeight: 600 }}>{mod.avgDuration}分</Text>
                    <Text style={{ textAlign: 'center', minWidth: 70, color: '#B87333', fontWeight: 600, fontSize: 14 }}>
                      {isExpanded ? '▲收起' : '▼展开'}
                    </Text>
                  </View>
                  {isExpanded && (
                    <View className={styles.moduleExpanded}>
                      <Text className={styles.moduleExpandedTitle}>
                        📋 {mod.label} · 按班次明细 ({mod.shiftDetails.length}条)
                      </Text>
                      <View className={styles.moduleExpandedTable}>
                        <View className={styles.moduleSubHead}>
                          <Text style={{ minWidth: 110, fontWeight: 600 }}>日期/班次</Text>
                          <Text style={{ textAlign: 'right', minWidth: 80, fontWeight: 600 }}>本工序产出</Text>
                          <Text style={{ textAlign: 'right', minWidth: 80, fontWeight: 600 }}>合格率</Text>
                          <Text style={{ textAlign: 'right', minWidth: 60, fontWeight: 600 }}>判定</Text>
                        </View>
                        {mod.shiftDetails.slice().reverse().slice(0, 18).map((sd, i) => (
                          <View className={styles.moduleSubRow} key={i} style={{ background: sd.isAnomaly ? 'rgba(239,68,68,0.05)' : undefined }}>
                            <View style={{ minWidth: 110 }}>
                              <Text style={{ fontSize: 12 }}>{sd.date}</Text>
                              <View>
                                <Text style={{ fontSize: 10, color: '#94A3B8' }}>{sd.shiftName}</Text>
                              </View>
                            </View>
                            <Text style={{ textAlign: 'right', minWidth: 80, fontSize: 12 }}>{(sd.output / 1000).toFixed(2)}t</Text>
                            <Text
                              style={{ textAlign: 'right', minWidth: 80, fontSize: 12, color: sd.pass >= mod.anomalyLow + 1 ? '#10B981' : '#F59E0B', fontWeight: 600 }}
                            >
                              {sd.pass}%
                            </Text>
                            <Text
                              style={{
                                textAlign: 'right', minWidth: 60, fontSize: 11, fontWeight: 600,
                                color: sd.isAnomaly ? '#EF4444' : '#10B981'
                              }}
                            >
                              {sd.isAnomaly ? '⚠️异常' : '✅正常'}
                            </Text>
                          </View>
                        ))}
                        {mod.shiftDetails.length > 18 && (
                          <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: '8px 0' }}>
                            仅显示最近18条，共{mod.shiftDetails.length}条
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>生产班次明细 (共{report.stats.length}条 · 完整展示)</Text>
        </View>
        <ScrollView scrollX className={styles.tableScroll}>
          <View className={styles.dataTable}>
            <View className={styles.tableHead}>
              <Text style={{ minWidth: 140 }}>日期/班次</Text>
              <Text style={{ textAlign: 'right', minWidth: 80 }}>投料</Text>
              <Text style={{ textAlign: 'right', minWidth: 80 }}>成品</Text>
              <Text style={{ textAlign: 'right', minWidth: 80 }}>合格率</Text>
              <Text style={{ textAlign: 'right', minWidth: 70 }}>工时</Text>
            </View>
            {report.stats.slice().reverse().map((row, idx) => (
              <View className={styles.tableRow} key={idx}>
                <View style={{ minWidth: 140 }}>
                  <Text>{row.date.slice(5)}</Text>
                  <View style={{ marginTop: 4 }}>
                    <Text className={styles.shift}>{shiftNameMap[row.shift]}</Text>
                  </View>
                </View>
                <Text style={{ textAlign: 'right', minWidth: 80 }}>{(row.feedingWeight / 1000).toFixed(1)}t</Text>
                <Text style={{ textAlign: 'right', minWidth: 80 }}>{(row.finishedWeight / 1000).toFixed(1)}t</Text>
                <Text
                  style={{ textAlign: 'right', minWidth: 80 }}
                  className={row.passRate >= 98.5 ? styles.rateOk : styles.rateWarn}
                >
                  {row.passRate}%
                </Text>
                <Text style={{ textAlign: 'right', minWidth: 70 }}>{row.runningHours}h</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {report.stats.length === 0 && (
          <View className={styles.emptyTip}>
            <Text>暂无该范围内的统计数据</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ReportsPage;
