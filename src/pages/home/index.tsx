import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatCard from '@/components/StatCard';
import ModuleCard from '@/components/ModuleCard';
import SimpleChart from '@/components/SimpleChart';
import {
  moduleStatusList,
  productionStatsList,
  currentUser,
  dailyOutputChart,
  shiftNameMap
} from '@/data/mockData';

const HomePage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setCurrentTime(dateStr);
  }, []);

  useDidShow(() => {
    console.log('[HomePage] 页面显示');
  });

  usePullDownRefresh(() => {
    console.log('[HomePage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  });

  const todayStats = productionStatsList.find(
    (s) => s.date === '2026-06-17' && s.shift === currentUser.currentShift
  ) || productionStatsList[0];

  const handleQuickAction = (action: string) => {
    console.log('[HomePage] 快捷操作:', action);
    const pageMap: Record<string, string> = {
      feeding: '/pages/feeding-detail/index',
      melting: '/pages/melting-detail/index',
      rolling: '/pages/rolling-detail/index',
      inspection: '/pages/inspection-detail/index'
    };
    const path = pageMap[action];
    if (path) {
      Taro.navigateTo({ url: path });
    }
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.headerBg}>
        <View className={styles.headerTop}>
          <View className={styles.greeting}>
            <View className={styles.hello}>下午好，欢迎回来</View>
            <View className={styles.name}>{currentUser.name}</View>
            <View className={styles.dateInfo}>{currentTime}</View>
          </View>
          <View className={styles.shiftBadge}>
            {shiftNameMap[currentUser.currentShift]}值班
          </View>
        </View>
      </View>

      <View className={styles.statsGrid}>
        <StatCard
          icon="⚙"
          label="今日投料"
          value={((todayStats.feedingWeight || 0) / 1000).toFixed(1)}
          unit="吨"
          color="copper"
          subInfo="目标12.5吨"
          trend="up"
          trendValue="3.2%"
        />
        <StatCard
          icon="🔥"
          label="成品产量"
          value={((todayStats.finishedWeight || 0) / 1000).toFixed(1)}
          unit="吨"
          color="orange"
          subInfo="较昨日"
          trend="up"
          trendValue="5.6%"
        />
        <StatCard
          icon="✅"
          label="合格率"
          value={todayStats.passRate || 0}
          unit="%"
          color="green"
          subInfo="目标 ≥ 98%"
        />
        <StatCard
          icon="⏱"
          label="运行时长"
          value={todayStats.runningHours || 0}
          unit="小时"
          color="blue"
          subInfo="当班累计"
        />
      </View>

      <View className={styles.contentArea}>
        <View className={styles.sectionHeader}>
          <View className={styles.title}>
            <View className={styles.bar}></View>
            <Text>快捷操作</Text>
          </View>
        </View>
        <View className={styles.quickActions}>
          <View className={styles.actionItem} onClick={() => handleQuickAction('feeding')}>
            <View className={`${styles.actionIcon} ${styles.c1}`}>铜</View>
            <Text className={styles.actionLabel}>阴极铜上料</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleQuickAction('melting')}>
            <View className={`${styles.actionIcon} ${styles.c2}`}>熔</View>
            <Text className={styles.actionLabel}>温度记录</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleQuickAction('rolling')}>
            <View className={`${styles.actionIcon} ${styles.c3}`}>轧</View>
            <Text className={styles.actionLabel}>直径检测</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleQuickAction('inspection')}>
            <View className={`${styles.actionIcon} ${styles.c4}`}>检</View>
            <Text className={styles.actionLabel}>成品检验</Text>
          </View>
        </View>

        <View className={styles.sectionHeader}>
          <View className={styles.title}>
            <View className={styles.bar}></View>
            <Text>设备运行状态</Text>
          </View>
          <Text
            className={styles.more}
            onClick={() => Taro.switchTab({ url: '/pages/production/index' })}
          >
            全部 →
          </Text>
        </View>

        {moduleStatusList.slice(0, 4).map((module) => (
          <ModuleCard key={module.key} data={module} />
        ))}

        <View className={styles.sectionHeader}>
          <View className={styles.title}>
            <View className={styles.bar}></View>
            <Text>生产趋势</Text>
          </View>
        </View>
        <SimpleChart
          title="近7日产量趋势"
          unit="吨"
          data={dailyOutputChart}
          type="bar"
          color="copper"
        />

        <View className={styles.sectionHeader}>
          <View className={styles.title}>
            <View className={styles.bar}></View>
            <Text>预警提示</Text>
          </View>
        </View>
        <View className={styles.alertList}>
          <View className={styles.alertItem}>
            <View className={styles.alertIcon}>!</View>
            <View className={styles.alertContent}>
              <Text className={styles.title}>1#保温炉液位偏低</Text>
              <Text className={styles.time}>当前液位 72%，建议及时补铜液</Text>
            </View>
          </View>
          <View className={styles.alertItem}>
            <View className={`${styles.alertIcon} ${styles.info}`}>i</View>
            <View className={styles.alertContent}>
              <Text className={styles.title}>B2026061704批次待检</Text>
              <Text className={styles.time}>已等待15分钟，请及时安排检验</Text>
            </View>
          </View>
          <View className={styles.alertItem}>
            <View className={`${styles.alertIcon} ${styles.error}`}>✕</View>
            <View className={styles.alertContent}>
              <Text className={styles.title}>酸液浓度接近下限</Text>
              <Text className={styles.time}>当前浓度12.3%，建议补充酸液</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
