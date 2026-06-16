import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import StatCard from '@/components/StatCard';
import ModuleCard from '@/components/ModuleCard';
import SimpleChart from '@/components/SimpleChart';
import { useProductionStore } from '@/store/production';
import { currentUser, shiftNameMap } from '@/data/mockData';

const HomePage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');

  const moduleStatus = useProductionStore((s) => s.moduleStatus);
  const records = useProductionStore((s) => s.records);
  const alerts = useProductionStore((s) => s.alerts);
  const getReportsByDateRange = useProductionStore((s) => s.getReportsByDateRange);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setCurrentTime(dateStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
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

  const today = new Date().toISOString().slice(0, 10);
  const report7d = useMemo(() => getReportsByDateRange('7d'), [getReportsByDateRange]);

  const todayFeed = useMemo(
    () => records.feeding.filter((r) => r.createTime.startsWith(today)).reduce((s, r) => s + r.cathodeCopperWeight, 0),
    [records.feeding, today]
  );
  const todayFinished = useMemo(
    () => records.pickling.filter((r) => r.createTime.startsWith(today)).reduce((s, r) => s + r.coilWeight, 0),
    [records.pickling, today]
  );
  const todayInspections = useMemo(
    () => records.inspection.filter((r) => r.createTime.startsWith(today)),
    [records.inspection, today]
  );
  const todayPassRate = useMemo(() => {
    if (todayInspections.length === 0) return 98.5;
    const pass = todayInspections.filter((r) => r.overallResult === 'pass').length;
    const warn = todayInspections.filter((r) => r.overallResult === 'warning').length;
    return Number((((pass + warn) / todayInspections.length) * 100).toFixed(1));
  }, [todayInspections]);

  const todayRunningHours = useMemo(() => {
    const h = report7d.stats.filter((s) => s.date.startsWith(today)).reduce((s, r) => s + r.runningHours, 0);
    return h > 0 ? Number(h.toFixed(1)) : 6.5;
  }, [report7d.stats, today]);

  const pendingAlertCount = alerts.filter((a) => !a.isHandled).length;
  const handledAlertCount = alerts.filter((a) => a.isHandled).length;

  const handleQuickAction = (action: string) => {
    const pageMap: Record<string, string> = {
      feeding: '/pages/feeding-detail/index',
      melting: '/pages/melting-detail/index',
      furnace: '/pages/furnace-detail/index',
      casting: '/pages/casting-detail/index',
      rolling: '/pages/rolling-detail/index',
      pickling: '/pages/pickling-detail/index',
      inspection: '/pages/inspection-detail/index',
      trace: '/pages/batch-trace/index',
      alert: '/pages/alert-handle/index'
    };
    const path = pageMap[action];
    if (path) {
      Taro.navigateTo({ url: path });
    }
  };

  const handleAlertClick = (alertId: string) => {
    Taro.navigateTo({ url: `/pages/alert-handle/index?alertId=${alertId}` });
  };

  const getAlertIconStyle = (type: string) => {
    if (type === 'error') return styles.error;
    if (type === 'info') return styles.info;
    return '';
  };

  const getAlertIcon = (type: string) => {
    if (type === 'error') return '✕';
    if (type === 'info') return 'i';
    return '!';
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
        {pendingAlertCount > 0 && (
          <View className={styles.alertBanner} onClick={() => handleQuickAction('alert')}>
            <View className={styles.alertDot}></View>
            <Text className={styles.alertBannerText}>当前有 {pendingAlertCount} 条待处理预警，点击处理</Text>
            <Text className={styles.alertArrow}>→</Text>
          </View>
        )}
      </View>

      <View className={styles.statsGrid}>
        <StatCard
          icon="⚙"
          label="今日投料"
          value={(todayFeed / 1000).toFixed(1)}
          unit="吨"
          color="copper"
          subInfo={`已录入 ${records.feeding.filter((r) => r.createTime.startsWith(today)).length} 批`}
          trend="up"
          trendValue="3.2%"
        />
        <StatCard
          icon="🔥"
          label="成品产量"
          value={(todayFinished / 1000).toFixed(1)}
          unit="吨"
          color="orange"
          subInfo={`已成圈 ${records.pickling.filter((r) => r.createTime.startsWith(today)).length} 卷`}
          trend="up"
          trendValue="5.6%"
        />
        <StatCard
          icon="✅"
          label="合格率"
          value={todayPassRate}
          unit="%"
          color="green"
          subInfo={`检验 ${todayInspections.length} 批`}
        />
        <StatCard
          icon="⏱"
          label="运行时长"
          value={todayRunningHours}
          unit="小时"
          color="blue"
          subInfo={`${moduleStatus.filter((m) => m.status === 'running').length}/${moduleStatus.length} 运行`}
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
          <View className={styles.actionItem} onClick={() => handleQuickAction('trace')}>
            <View className={`${styles.actionIcon} ${styles.c5}`}>溯</View>
            <Text className={styles.actionLabel}>批次追踪</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleQuickAction('alert')}>
            <View className={`${styles.actionIcon} ${styles.c6}`}>
              处
              {pendingAlertCount > 0 && (
                <View className={styles.badgeMini}>{pendingAlertCount}</View>
              )}
            </View>
            <Text className={styles.actionLabel}>异常处理</Text>
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

        {moduleStatus.slice(0, 4).map((module) => (
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
          data={report7d.outputChart}
          type="bar"
          color="copper"
        />

        <View className={styles.sectionHeader}>
          <View className={styles.title}>
            <View className={styles.bar}></View>
            <Text>预警提示 ({pendingAlertCount}待处理 / {handledAlertCount}已处理)</Text>
          </View>
          <Text
            className={styles.more}
            onClick={() => handleQuickAction('alert')}
          >
            管理 →
          </Text>
        </View>
        <View className={styles.alertList}>
          {alerts.length === 0 ? (
            <View className={styles.emptyAlert}>
              <Text>暂无预警信息</Text>
            </View>
          ) : (
            alerts.map((alert) => (
              <View
                key={alert.id}
                className={classnames(styles.alertItem, alert.isHandled && styles.handled)}
                onClick={() => handleAlertClick(alert.id)}
              >
                <View className={classnames(styles.alertIcon, getAlertIconStyle(alert.type))}>
                  {getAlertIcon(alert.type)}
                </View>
                <View className={styles.alertContent}>
                  <View className={styles.alertTitleRow}>
                    <Text className={styles.title}>{alert.title}</Text>
                    {alert.isHandled && (
                      <View className={styles.handledTag}>
                        <Text>已处理</Text>
                      </View>
                    )}
                  </View>
                  <Text className={styles.time}>{alert.message}</Text>
                  <View className={styles.metaRow}>
                    <Text className={styles.metaText}>{alert.createTime.slice(5)}</Text>
                    {alert.isHandled && (
                      <Text className={styles.metaText}>
                        · {alert.handler}处理于 {alert.handleTime?.slice(11, 16)}
                      </Text>
                    )}
                  </View>
                </View>
                <View className={styles.arrow}>›</View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
