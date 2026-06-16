import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import ModuleCard from '@/components/ModuleCard';
import SectionHeader from '@/components/SectionHeader';
import { useProductionStore } from '@/store/production';
import { shiftNameMap, currentUser } from '@/data/mockData';

interface TabItem {
  key: string;
  label: string;
}

const tabs: TabItem[] = [
  { key: 'all', label: '全部模块' },
  { key: 'feeding', label: '阴极铜投料' },
  { key: 'melting', label: '竖炉熔化' },
  { key: 'furnace', label: '保温炉' },
  { key: 'casting', label: '连铸成型' },
  { key: 'rolling', label: '连轧拉拔' },
  { key: 'pickling', label: '酸洗成圈' },
  { key: 'inspection', label: '成品检验' }
];

const filterOptions = ['全部状态', '运行中', '注意', '待机'];

const ProductionPage: React.FC = () => {
  const moduleStatus = useProductionStore((s) => s.moduleStatus);
  const records = useProductionStore((s) => s.records);
  const getFilteredModules = useProductionStore((s) => s.getFilteredModules);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<number>(0);

  usePullDownRefresh(() => {
    console.log('[ProductionPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const statusFilterText = activeFilter === 0 ? 'all' : filterOptions[activeFilter];

  const filteredModules = useMemo(() => {
    if (statusFilterText === 'all') {
      return activeTab === 'all'
        ? moduleStatus
        : moduleStatus.filter((m) => m.key === activeTab);
    }
    return getFilteredModules(activeTab, statusFilterText);
  }, [moduleStatus, activeTab, statusFilterText, getFilteredModules]);

  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const count = {
      feeding: 0,
      melting: 0,
      furnace: 0,
      casting: 0,
      rolling: 0,
      pickling: 0,
      inspection: 0
    };
    (Object.keys(count) as Array<keyof typeof count>).forEach((k) => {
      count[k] = records[k].filter((r) => r.createTime.startsWith(today)).length;
    });
    return count;
  }, [records]);

  const totalAll = Object.values(todayRecords).reduce((a, b) => a + b, 0);
  const runningCount = moduleStatus.filter((m) => m.status === 'running').length;
  const warningCount = moduleStatus.filter((m) => m.status === 'warning').length;
  const standbyCount = moduleStatus.filter((m) => m.status === 'standby' || m.status === 'stopped').length;

  const handleTabClick = (key: string) => {
    setActiveTab(key);
  };

  const handleFilterClick = (idx: number) => {
    setActiveFilter(idx);
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.tabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </ScrollView>

      <View className={styles.moduleArea}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text
            className={classnames(styles.searchInput, styles.placeholderText)}
            onClick={() => Taro.navigateTo({ url: '/pages/batch-trace/index' })}
          >
            点击进入批次追踪...
          </Text>
        </View>

        <View className={styles.filterTags}>
          {filterOptions.map((opt, idx) => {
            let badge = '';
            if (idx === 1) badge = runningCount > 0 ? String(runningCount) : '';
            if (idx === 2) badge = warningCount > 0 ? String(warningCount) : '';
            if (idx === 3) badge = standbyCount > 0 ? String(standbyCount) : '';
            return (
              <View
                key={idx}
                className={classnames(styles.filterTag, activeFilter === idx && styles.active)}
                onClick={() => handleFilterClick(idx)}
              >
                <Text>{opt}</Text>
                {badge && (
                  <View className={styles.filterBadge}>
                    <Text>{badge}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View className={styles.summaryBar}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalAll}</Text>
            <Text className={styles.summaryLabel}>今日记录</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{runningCount}</Text>
            <Text className={styles.summaryLabel}>运行设备</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{warningCount}</Text>
            <Text className={styles.summaryLabel}>注意项</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{shiftNameMap[currentUser.currentShift]}</Text>
            <Text className={styles.summaryLabel}>当前班次</Text>
          </View>
        </View>

        <SectionHeader
          title="生产模块"
          extra={`筛选后 ${filteredModules.length} / 共 ${moduleStatus.length} 个`}
        />

        {filteredModules.length > 0 ? (
          filteredModules.map((module) => (
            <ModuleCard key={module.key} data={module} />
          ))
        ) : (
          <View className={styles.emptyCard}>
            <Text className={styles.emptyText}>暂无符合筛选条件的模块</Text>
            <Text
              className={styles.emptyHint}
              onClick={() => { setActiveTab('all'); setActiveFilter(0); }}
            >
              点击重置筛选
            </Text>
          </View>
        )}

        <SectionHeader
          title="今日录入统计"
          extra="查看报表"
          onExtraClick={() => Taro.switchTab({ url: '/pages/reports/index' })}
        />

        <View className={styles.statGrid}>
          {[
            { key: 'feeding', label: '投料', color: '#3B82F6', val: todayRecords.feeding },
            { key: 'melting', label: '熔化', color: '#DC2626', val: todayRecords.melting },
            { key: 'furnace', label: '保温', color: '#F97316', val: todayRecords.furnace },
            { key: 'casting', label: '连铸', color: '#2563EB', val: todayRecords.casting },
            { key: 'rolling', label: '连轧', color: '#059669', val: todayRecords.rolling },
            { key: 'pickling', label: '酸洗', color: '#7C3AED', val: todayRecords.pickling },
            { key: 'inspection', label: '检验', color: '#0891B2', val: todayRecords.inspection }
          ].map((item) => (
            <View key={item.key} className={styles.statCard}>
              <View className={styles.statDot} style={{ background: item.color }}></View>
              <Text className={styles.statNum}>{item.val}</Text>
              <Text className={styles.statName}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ProductionPage;
