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

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month'>('7d');
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

  const shiftStats = useMemo(() => {
    const byShift = new Map<string, { feed: number; out: number; rates: number[]; hours: number; count: number }>();
    report.stats.forEach((s) => {
      const k = s.date;
      const prev = byShift.get(k) || { feed: 0, out: 0, rates: [], hours: 0, count: 0 };
      prev.feed += s.feedingWeight;
      prev.out += s.finishedWeight;
      prev.rates.push(s.passRate);
      prev.hours += s.runningHours;
      prev.count += 1;
      byShift.set(k, prev);
    });
    return byShift;
  }, [report.stats]);

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : new Date().getDate();

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
          <Text>统计范围: {report.stats.length > 0 ? report.stats[0].date.slice(5) : '--'} ~ {report.stats.length > 0 ? report.stats[report.stats.length - 1].date.slice(5) : '--'} 共 {rangeDays}天 / {report.stats.length}个班次</Text>
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
          <Text>产量趋势 ({dateRange === '7d' ? '近7天' : dateRange === '30d' ? '近30天' : '本月'})</Text>
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
          <Text>生产班次明细 ({report.stats.length}条)</Text>
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
            {report.stats.slice().reverse().slice(0, 30).map((row, idx) => (
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
