import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import ModuleCard from '@/components/ModuleCard';
import SectionHeader from '@/components/SectionHeader';
import {
  moduleStatusList,
  feedingRecords,
  meltingRecords,
  furnaceRecords,
  castingRecords,
  rollingRecords,
  picklingRecords,
  inspectionRecords,
  shiftNameMap,
  currentUser
} from '@/data/mockData';

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
  const [activeTab, setActiveTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState(0);

  usePullDownRefresh(() => {
    console.log('[ProductionPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const filteredModules = activeTab === 'all'
    ? moduleStatusList
    : moduleStatusList.filter((m) => m.key === activeTab);

  const getTotalRecords = () => {
    return {
      feeding: feedingRecords.length,
      melting: meltingRecords.length,
      furnace: furnaceRecords.length,
      casting: castingRecords.length,
      rolling: rollingRecords.length,
      pickling: picklingRecords.length,
      inspection: inspectionRecords.length
    };
  };

  const totalRecords = getTotalRecords();
  const totalAll = Object.values(totalRecords).reduce((a, b) => a + b, 0);

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.tabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </ScrollView>

      <View className={styles.moduleArea}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={classnames(styles.searchInput, styles.placeholderText)}>
            搜索批次号、操作人员...
          </Text>
        </View>

        <View className={styles.filterTags}>
          {filterOptions.map((opt, idx) => (
            <View
              key={idx}
              className={classnames(styles.filterTag, activeFilter === idx && styles.active)}
              onClick={() => setActiveFilter(idx)}
            >
              {opt}
            </View>
          ))}
        </View>

        <View className={styles.summaryBar}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalAll}</Text>
            <Text className={styles.summaryLabel}>今日记录</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{moduleStatusList.filter((m) => m.status === 'running').length}</Text>
            <Text className={styles.summaryLabel}>运行设备</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{shiftNameMap[currentUser.currentShift]}</Text>
            <Text className={styles.summaryLabel}>当前班次</Text>
          </View>
        </View>

        <SectionHeader
          title="生产模块"
          extra={`共 ${filteredModules.length} 个`}
        />

        {filteredModules.map((module) => (
          <ModuleCard key={module.key} data={module} />
        ))}

        <SectionHeader
          title="今日录入统计"
          extra="查看全部"
          onExtraClick={() => Taro.switchTab({ url: '/pages/reports/index' })}
        />

        <View className={styles.summaryBar} style={{ marginBottom: 0 }}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalRecords.feeding}</Text>
            <Text className={styles.summaryLabel}>投料</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalRecords.melting}</Text>
            <Text className={styles.summaryLabel}>熔化</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalRecords.casting}</Text>
            <Text className={styles.summaryLabel}>连铸</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalRecords.rolling}</Text>
            <Text className={styles.summaryLabel}>连轧</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalRecords.inspection}</Text>
            <Text className={styles.summaryLabel}>检验</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProductionPage;
