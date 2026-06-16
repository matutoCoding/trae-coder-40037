import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import DataForm, { FormItemData } from '@/components/DataForm';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { currentUser, shiftNameMap } from '@/data/mockData';
import { useProductionStore } from '@/store/production';

const FeedingDetailPage: React.FC = () => {
  const { records, addFeedingRecord, getNextBatchNo, moduleStatus } = useProductionStore();
  const feedingList = records.feeding;

  const nextBatchNo = useMemo(() => getNextBatchNo(), [feedingList.length, getNextBatchNo]);

  const [weight, setWeight] = useState<string>('2500');
  const [grade, setGrade] = useState<string>('A级阴极铜');
  const [supplier, setSupplier] = useState<string>('江西铜业');

  const modStatus = moduleStatus.find((m) => m.key === 'feeding');

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayList = feedingList.filter((r) => r.createTime.startsWith(today));
    const total = todayList.reduce((s, r) => s + r.cathodeCopperWeight, 0);
    const count = todayList.length;
    return {
      totalTons: (total / 1000).toFixed(1),
      count,
      avgTons: count > 0 ? ((total / count) / 1000).toFixed(1) : '0'
    };
  }, [feedingList]);

  const handleSubmit = () => {
    const w = Number(weight);
    if (!w || w < 100 || w > 5000) {
      Taro.showToast({ title: '请输入正确的重量(100-5000kg)', icon: 'none' });
      return;
    }
    addFeedingRecord({
      batchNo: nextBatchNo,
      cathodeCopperWeight: w,
      materialGrade: grade,
      supplier
    });
    Taro.showToast({ title: '上料记录已录入', icon: 'success' });
    console.log('[FeedingDetail] 录入投料记录:', nextBatchNo, w, grade, supplier);
    setWeight('2500');
  };

  const currentInfo: FormItemData[] = [
    { label: '生成批次号', value: nextBatchNo, highlight: true },
    { label: '上料时间', value: new Date().toLocaleString('zh-CN') },
    { label: '操作人员', value: currentUser.name },
    { label: '所属班次', value: shiftNameMap[currentUser.currentShift] },
    { label: '当前料仓', value: 'A号料仓' },
    { label: '今日累计投料', value: `${stats.totalTons} 吨 / ${stats.count} 批` }
  ];

  const lastRecord = feedingList[0];
  const lastInfo: FormItemData[] = lastRecord
    ? [
        { label: '批次号', value: lastRecord.batchNo, highlight: true },
        { label: '阴极铜重量', value: `${lastRecord.cathodeCopperWeight} kg`, variant: 'success' },
        { label: '原料等级', value: lastRecord.materialGrade },
        { label: '供应商', value: lastRecord.supplier },
        { label: '上料时间', value: lastRecord.feedingTime },
        { label: '操作人', value: lastRecord.operator }
      ]
    : [];

  const recordList: ListItem[] = feedingList.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.feedingTime,
    operator: r.operator,
    statusType: 'pass',
    statusText: '已入库',
    data: [
      { label: '投料重量', value: `${r.cathodeCopperWeight} kg` },
      { label: '原料等级', value: r.materialGrade }
    ]
  }));

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>阴极铜投料</Text>
        <Text className={styles.desc}>阴极铜上料记录管理 · A号料仓运行正常</Text>
        <View className={styles.headerStats}>
          <View className={styles.statBox}>
            <Text className={styles.value}>{stats.totalTons}</Text>
            <Text className={styles.label}>今日累计(吨)</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.value}>{stats.count}</Text>
            <Text className={styles.label}>投料批次</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.value}>{stats.avgTons}</Text>
            <Text className={styles.label}>均重(吨)</Text>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <StatusBadge type={modStatus?.status || 'running'} text={modStatus?.status === 'running' ? '投料系统运行中' : '设备异常'} />
        <StatusBadge type="running" text={`投料速度: ${modStatus?.currentValue || '-'} t/h`} showDot={false} />
      </View>

      <View className={styles.inputForm}>
        <View className={styles.formTitle}>
          <View className={styles.bar}></View>
          <Text>📥 现场录入上料数据</Text>
        </View>

        <View className={styles.inputItem}>
          <Text className={styles.inputLabel}>阴极铜重量 (kg)</Text>
          <Input
            className={styles.inputBox}
            type="digit"
            value={weight}
            onInput={(e: any) => setWeight(e.detail.value)}
            placeholder="请输入投料重量"
          />
        </View>

        <View className={styles.inputItem}>
          <Text className={styles.inputLabel}>原料等级</Text>
          <View style={{ display: 'flex', gap: 12 }}>
            {['A级阴极铜', 'B级阴极铜'].map((g) => (
              <Text
                key={g}
                className={`${styles.inputBox}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: grade === g ? 'rgba(184,115,51,0.12)' : '#F8FAFC',
                  color: grade === g ? '#B87333' : '#475569',
                  fontWeight: grade === g ? 600 : 400,
                  border: grade === g ? '2rpx solid rgba(184,115,51,0.4)' : '2rpx solid transparent'
                }}
                onClick={() => setGrade(g)}
              >
                {g}
              </Text>
            ))}
          </View>
        </View>

        <View className={styles.inputItem}>
          <Text className={styles.inputLabel}>供应商</Text>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {['江西铜业', '云南铜业', '铜陵有色'].map((s) => (
              <Text
                key={s}
                className={`${styles.inputBox}`}
                style={{
                  minWidth: '30%',
                  flex: 1,
                  textAlign: 'center',
                  background: supplier === s ? 'rgba(184,115,51,0.12)' : '#F8FAFC',
                  color: supplier === s ? '#B87333' : '#475569',
                  fontWeight: supplier === s ? 600 : 400,
                  border: supplier === s ? '2rpx solid rgba(184,115,51,0.4)' : '2rpx solid transparent'
                }}
                onClick={() => setSupplier(s)}
              >
                {s}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <DataForm
        title="录入预览 - 提交后即生效"
        items={currentInfo}
        showActions
        primaryText="确认录入上料"
        secondaryText="扫码录入"
        onPrimaryClick={handleSubmit}
        onSecondaryClick={() => Taro.showToast({ title: '扫码功能开发中', icon: 'none' })}
      />

      {lastRecord && (
        <>
          <SectionHeader title="上一批记录" />
          <DataForm title={lastRecord.batchNo} items={lastInfo} />
        </>
      )}

      <SectionHeader title={`历史投料记录 (共${recordList.length}条)`} />
      <RecordList records={recordList} />
    </ScrollView>
  );
};

export default FeedingDetailPage;
