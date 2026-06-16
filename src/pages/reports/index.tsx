import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import SimpleChart from '@/components/SimpleChart';
import {
  dailyOutputChart,
  passRateChart,
  productionStatsList,
  shiftNameMap
} from '@/data/mockData';

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month'>('7d');

  usePullDownRefresh(() => {
    console.log('[ReportsPage] 下拉刷新');
    setTimeout(() => Taro.stopPullDownRefresh(), 800);
  });

  const totalOutput = productionStatsList.reduce((sum, s) => sum + s.finishedWeight, 0);
  const avgPassRate = (
    productionStatsList.reduce((sum, s) => sum + s.passRate, 0) / productionStatsList.length
  ).toFixed(1);
  const totalHours = productionStatsList.reduce((sum, s) => sum + s.runningHours, 0);
  const totalFeed = productionStatsList.reduce((sum, s) => sum + s.feedingWeight, 0);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>数据报表</Text>
        <Text className={styles.pageSub}>生产数据统计与趋势分析</Text>
        <View className={styles.dateSwitch}>
          {([
            { k: '7d', l: '近7天' },
            { k: '30d', l: '近30天' },
            { k: 'month', l: '本月' }
          ] as const).map((item) => (
            <Text
              key={item.k}
              className={classnames(styles.dateItem, dateRange === item.k && styles.active)}
              onClick={() => setDateRange(item.k)}
            >
              {item.l}
            </Text>
          ))}
        </View>
      </View>

      <View className={styles.summaryCards}>
        <View className={styles.sumCard}>
          <Text className={styles.label}>累计成品</Text>
          <Text className={styles.value}>
            {(totalOutput / 1000).toFixed(1)}
            <Text className={styles.unit}>吨</Text>
          </Text>
          <Text className={`${styles.trend} ${styles.up}`}>↑ 环比增长 4.2%</Text>
        </View>
        <View className={styles.sumCard}>
          <Text className={styles.label}>平均合格率</Text>
          <Text className={styles.value}>
            {avgPassRate}
            <Text className={styles.unit}>%</Text>
          </Text>
          <Text className={`${styles.trend} ${styles.up}`}>↑ 较上期提升 0.3%</Text>
        </View>
        <View className={styles.sumCard}>
          <Text className={styles.label}>运行时长</Text>
          <Text className={styles.value}>
            {totalHours.toFixed(1)}
            <Text className={styles.unit}>小时</Text>
          </Text>
          <Text className={styles.trend}>7个班次统计</Text>
        </View>
        <View className={styles.sumCard}>
          <Text className={styles.label}>累计投料</Text>
          <Text className={styles.value}>
            {(totalFeed / 1000).toFixed(1)}
            <Text className={styles.unit}>吨</Text>
          </Text>
          <Text className={styles.trend}>成品率 {((totalOutput / totalFeed) * 100).toFixed(1)}%</Text>
        </View>
      </View>

      <View className={styles.contentArea}>
        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>产量趋势</Text>
        </View>
        <SimpleChart title="每日成品产量" unit="吨" data={dailyOutputChart} type="bar" color="copper" />

        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>合格率趋势</Text>
        </View>
        <SimpleChart title="质量合格率" unit="%" data={passRateChart} type="line" color="green" />

        <View className={styles.kpiRow}>
          <View className={styles.kpiBox}>
            <Text className={styles.kpiV}>94.8%</Text>
            <Text className={styles.kpiL}>设备利用率</Text>
          </View>
          <View className={styles.kpiBox}>
            <Text className={styles.kpiV}>1.35</Text>
            <Text className={styles.kpiL}>吨铜油耗 (m³)</Text>
          </View>
          <View className={styles.kpiBox}>
            <Text className={styles.kpiV}>8.02mm</Text>
            <Text className={styles.kpiL}>平均直径</Text>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <View className={styles.bar}></View>
          <Text>生产班次明细</Text>
        </View>
        <View className={styles.dataTable}>
          <View className={styles.tableHead}>
            <Text>日期/班次</Text>
            <Text style={{ textAlign: 'right' }}>投料</Text>
            <Text style={{ textAlign: 'right' }}>成品</Text>
            <Text style={{ textAlign: 'right' }}>合格率</Text>
            <Text style={{ textAlign: 'right' }}>工时</Text>
          </View>
          {productionStatsList.map((row, idx) => (
            <View className={styles.tableRow} key={idx}>
              <View>
                <Text>{row.date.slice(5)}</Text>
                <View style={{ marginTop: 4 }}>
                  <Text className={styles.shift}>{shiftNameMap[row.shift]}</Text>
                </View>
              </View>
              <Text style={{ textAlign: 'right' }}>{(row.feedingWeight / 1000).toFixed(1)}t</Text>
              <Text style={{ textAlign: 'right' }}>{(row.finishedWeight / 1000).toFixed(1)}t</Text>
              <Text
                style={{ textAlign: 'right' }}
                className={row.passRate >= 98.5 ? styles.rateOk : styles.rateWarn}
              >
                {row.passRate}%
              </Text>
              <Text style={{ textAlign: 'right' }}>{row.runningHours}h</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ReportsPage;
