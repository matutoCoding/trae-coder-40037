import React, { useState } from 'react';
import { View, Text, ScrollView, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useProductionStore, type AlertItem } from '@/store/production';
import classnames from 'classnames';

const moduleNameMap: Record<string, string> = {
  feeding: '阴极铜投料',
  melting: '竖炉熔化',
  furnace: '保温炉',
  casting: '连铸成型',
  rolling: '连轧拉拔',
  pickling: '酸洗成圈',
  inspection: '成品检验'
};

const AlertHandlePage: React.FC = () => {
  const { alerts, handleAlert } = useProductionStore();
  const [tab, setTab] = useState<'pending' | 'handled' | 'all'>('pending');
  const [handleInputs, setHandleInputs] = useState<Record<string, string>>({});

  const filteredAlerts: AlertItem[] = alerts.filter((a) => {
    if (tab === 'pending') return !a.isHandled;
    if (tab === 'handled') return a.isHandled;
    return true;
  }).sort((a, b) => (b.createTime > a.createTime ? 1 : -1));

  const counts = {
    total: alerts.length,
    pending: alerts.filter((a) => !a.isHandled).length,
    handled: alerts.filter((a) => a.isHandled).length
  };

  const doHandle = (alert: AlertItem) => {
    const text = (handleInputs[alert.id] || '').trim();
    if (!text) {
      Taro.showToast({ title: '请填写处理措施', icon: 'none' });
      return;
    }
    handleAlert(alert.id, text);
    setHandleInputs((prev) => ({ ...prev, [alert.id]: '' }));
    Taro.showToast({ title: '已记录处理措施', icon: 'success' });
    console.log('[AlertHandle] 处理预警:', alert.id, text);
  };

  const goToModule = (moduleKey: string) => {
    const pageMap: Record<string, string> = {
      furnace: '/pages/furnace-detail/index',
      pickling: '/pages/pickling-detail/index',
      inspection: '/pages/inspection-detail/index',
      melting: '/pages/melting-detail/index',
      rolling: '/pages/rolling-detail/index'
    };
    const path = pageMap[moduleKey];
    if (path) Taro.navigateTo({ url: path });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {([
          { k: 'pending', l: '待处理', c: counts.pending },
          { k: 'handled', l: '已处理', c: counts.handled },
          { k: 'all', l: '全部', c: counts.total }
        ] as const).map((t) => (
          <Text
            key={t.k}
            className={classnames(styles.tabItem, tab === t.k && styles.active)}
            onClick={() => setTab(t.k)}
          >
            {t.l} ({t.c})
          </Text>
        ))}
      </View>

      <View className={styles.summaryBar}>
        <View className={classnames(styles.sumItem, styles.pending)}>
          <Text className={styles.v}>{counts.pending}</Text>
          <Text className={styles.l}>待处理</Text>
        </View>
        <View className={classnames(styles.sumItem, styles.handled)}>
          <Text className={styles.v}>{counts.handled}</Text>
          <Text className={styles.l}>已处理</Text>
        </View>
        <View className={classnames(styles.sumItem, styles.total)}>
          <Text className={styles.v}>{counts.total}</Text>
          <Text className={styles.l}>预警总数</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.alertList}>
        {filteredAlerts.length === 0 && (
          <View
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 80,
              textAlign: 'center',
              color: '#94A3B8',
              boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)'
            }}
          >
            <Text style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>✨</Text>
            <Text>当前分类暂无预警记录</Text>
          </View>
        )}

        {filteredAlerts.map((alert) => (
          <View
            key={alert.id}
            className={classnames(
              styles.alertCard,
              styles[alert.type],
              alert.isHandled && styles.handled
            )}
          >
            <View className={styles.cardBody}>
              <View className={styles.cardHead}>
                <View className={styles.left}>
                  <Text className={styles.title}>{alert.title}</Text>
                  <View style={{ marginTop: 8 }}>
                    <Text
                      className={styles.module}
                      onClick={() => goToModule(alert.moduleKey)}
                    >
                      {moduleNameMap[alert.moduleKey] || alert.moduleKey}
                    </Text>
                  </View>
                </View>
                <StatusBadge
                  type={alert.isHandled ? 'standby' : alert.type === 'error' ? 'stopped' : alert.type === 'warning' ? 'warning' : 'running'}
                  text={alert.isHandled ? '已处理' : alert.type === 'error' ? '紧急' : alert.type === 'warning' ? '注意' : '提示'}
                />
              </View>

              <View className={styles.message}>{alert.message}</View>

              <View className={styles.meta}>
                <Text>🕐 发布: {alert.createTime.slice(5)}</Text>
                {alert.isHandled && alert.handleTime && (
                  <Text>✅ 处理: {alert.handleTime.slice(5)}</Text>
                )}
              </View>

              {alert.isHandled ? (
                <View className={styles.handleSection}>
                  <View className={styles.handledInfo}>
                    <View className={styles.row}>
                      <Text className={styles.k}>处理人</Text>
                      <Text className={styles.v}>{alert.handler}</Text>
                    </View>
                    <View className={styles.measure}>📝 处理措施：{alert.handleMeasure}</View>
                  </View>
                </View>
              ) : (
                <View className={styles.handleSection}>
                  <Textarea
                    className={styles.inputBox}
                    placeholder={`请输入针对"${alert.title}"的处理措施...`}
                    value={handleInputs[alert.id] || ''}
                    onInput={(e: any) =>
                      setHandleInputs((p) => ({ ...p, [alert.id]: e.detail.value }))
                    }
                    maxlength={200}
                    autoHeight
                  />
                  <View className={styles.btnRow}>
                    <Button
                      className={classnames(styles.btn, styles.btnSecondary)}
                      onClick={() => goToModule(alert.moduleKey)}
                    >
                      查看详情
                    </Button>
                    <Button
                      className={classnames(styles.btn, styles.btnPrimary)}
                      onClick={() => doHandle(alert)}
                    >
                      标记已处理
                    </Button>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}

        <View style={{ height: 60 }}></View>
      </ScrollView>
    </View>
  );
};

export default AlertHandlePage;
