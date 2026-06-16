import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { currentUser, shiftNameMap } from '@/data/mockData';
import { useProductionStore } from '@/store/production';

const MinePage: React.FC = () => {
  const alerts = useProductionStore((s) => s.alerts);
  const records = useProductionStore((s) => s.records);

  const pendingAlertCount = useMemo(() => alerts.filter((a) => !a.isHandled).length, [alerts]);
  const myRecordsCount = useMemo(() => {
    return Object.values(records).reduce((sum, arr) =>
      sum + arr.filter((r) => r.operator === currentUser.name).length, 0);
  }, [records]);

  const menuGroups = [
    {
      title: '生产作业',
      items: [
        { icon: '📋', iconClass: 'c1', name: '我的工单', desc: '查看和管理当前班次工单', badge: '3', action: () => Taro.showToast({ title: '工单列表', icon: 'none' }) },
        { icon: '📝', iconClass: 'c2', name: '操作记录', desc: `我已录入 ${myRecordsCount} 条生产记录`, action: () => Taro.switchTab({ url: '/pages/reports/index' }) },
        { icon: '🔔', iconClass: 'c4', name: '消息通知', desc: '系统通知与告警消息', badge: '5', action: () => Taro.showToast({ title: '消息通知', icon: 'none' }) }
      ]
    },
    {
      title: '质量管理',
      items: [
        { icon: '📊', iconClass: 'c3', name: '批次追踪', desc: '按批次号追溯阴极铜到成品全流程', action: () => Taro.navigateTo({ url: '/pages/batch-trace/index' }) },
        { icon: '🛠️', iconClass: 'c7', name: '异常处理', desc: '处理液位低、酸浓度低等预警', badge: pendingAlertCount > 0 ? String(pendingAlertCount) : undefined, action: () => Taro.navigateTo({ url: '/pages/alert-handle/index' }) },
        { icon: '📑', iconClass: 'c6', name: '异常上报', desc: '设备或质量异常报告', action: () => Taro.showToast({ title: '异常上报', icon: 'none' }) }
      ]
    },
    {
      title: '设置',
      items: [
        { icon: '👥', iconClass: 'c5', name: '班组信息', desc: '查看班组成员与排班', action: () => Taro.showToast({ title: '班组信息', icon: 'none' }) },
        { icon: '📱', iconClass: 'c8', name: '设备管理', desc: '设备台账与维护记录', action: () => Taro.showToast({ title: '设备管理', icon: 'none' }) },
        { icon: '⚙️', iconClass: 'c8', name: '系统设置', desc: '通知、权限、个人偏好', action: () => Taro.showToast({ title: '系统设置', icon: 'none' }) },
        { icon: 'ℹ️', iconClass: 'c8', name: '关于应用', desc: '版本 v1.0.0', action: () => Taro.showToast({ title: '铜杆连铸管理 v1.0.0', icon: 'none' }) }
      ]
    }
  ];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.userHeader}>
        <View className={styles.topRow}>
          <View className={styles.avatar}>
            <Text>{currentUser.name.charAt(0)}</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.name}>{currentUser.name}</Text>
            <Text className={styles.pos}>
              {currentUser.position} · {currentUser.department}
            </Text>
            <Text className={styles.id}>工号: {currentUser.employeeId}</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.v}>28</Text>
            <Text className={styles.l}>本月出勤(天)</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.v}>{myRecordsCount}</Text>
            <Text className={styles.l}>录入记录</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.v}>{pendingAlertCount}</Text>
            <Text className={styles.l}>待处理预警</Text>
          </View>
        </View>
      </View>

      <View className={styles.shiftCard}>
        <View className={styles.shiftNow}>
          <View>
            <Text className={styles.shiftLabel}>当前班次</Text>
            <Text className={styles.shiftName}>{shiftNameMap[currentUser.currentShift]}</Text>
            <Text className={styles.shiftTime}>14:00 - 22:00 · 已工作 0.5h</Text>
          </View>
          <Text
            className={styles.switchBtn}
            onClick={() => Taro.showActionSheet({
              itemList: ['早班 06:00-14:00', '中班 14:00-22:00', '晚班 22:00-06:00']
            })}
          >
            切换班次
          </Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.k}>联系电话</Text>
          <Text className={styles.v}>{currentUser.phone}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.k}>所属部门</Text>
          <Text className={styles.v}>{currentUser.department}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.k}>上次登录</Text>
          <Text className={styles.v}>2026-06-17 08:12:33</Text>
        </View>
      </View>

      {menuGroups.map((group, gIdx) => (
        <View className={styles.menuGroup} key={gIdx}>
          <View className={styles.groupTitle}>{group.title}</View>
          {group.items.map((item, idx) => (
            <View className={styles.menuItem} key={idx} onClick={item.action}>
              <View className={`${styles.icon} ${styles[item.iconClass]}`}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.text}>
                <Text className={styles.name}>{item.name}</Text>
                <Text className={styles.desc}>{item.desc}</Text>
              </View>
              {item.badge && <Text className={styles.badge}>{item.badge}</Text>}
              <Text className={styles.arrow}>›</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 22 }}>
        <Text>铜杆连铸车间管理系统 · 钉钉版</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
