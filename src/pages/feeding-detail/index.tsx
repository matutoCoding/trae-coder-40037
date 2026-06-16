import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import DataForm, { FormItemData } from '@/components/DataForm';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { feedingRecords, currentUser, shiftNameMap } from '@/data/mockData';

const FeedingDetailPage: React.FC = () => {
  const [formData] = useState({
    batchNo: 'B2026061706',
    feedingTime: new Date().toLocaleString('zh-CN'),
    operator: currentUser.name,
    shift: shiftNameMap[currentUser.currentShift]
  });

  const handleSubmit = () => {
    console.log('[FeedingDetail] 提交上料记录');
    Taro.showToast({
      title: '记录已提交',
      icon: 'success'
    });
  };

  const currentInfo: FormItemData[] = [
    { label: '当前批次号', value: formData.batchNo, highlight: true },
    { label: '上料时间', value: formData.feedingTime },
    { label: '操作人员', value: formData.operator },
    { label: '所属班次', value: formData.shift },
    { label: '当前料仓', value: 'A号料仓' },
    { label: '累计投料(今日)', value: '10.0 吨' }
  ];

  const lastRecord = feedingRecords[0];
  const lastInfo: FormItemData[] = [
    { label: '批次号', value: lastRecord.batchNo, highlight: true },
    { label: '阴极铜重量', value: `${lastRecord.cathodeCopperWeight} kg`, variant: 'success' },
    { label: '原料等级', value: lastRecord.materialGrade },
    { label: '供应商', value: lastRecord.supplier },
    { label: '上料时间', value: lastRecord.feedingTime },
    { label: '操作人', value: lastRecord.operator }
  ];

  const recordList: ListItem[] = feedingRecords.map((r) => ({
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
            <Text className={styles.value}>10.0</Text>
            <Text className={styles.label}>今日累计(吨)</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.value}>5</Text>
            <Text className={styles.label}>投料批次</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.value}>2.5</Text>
            <Text className={styles.label}>均重(吨)</Text>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 8 }}>
        <StatusBadge type="running" text="投料系统运行中" />
      </View>

      <DataForm
        title="待录入上料记录"
        items={currentInfo}
        showActions
        primaryText="确认上料"
        secondaryText="扫码录入"
        onPrimaryClick={handleSubmit}
        onSecondaryClick={() => Taro.showToast({ title: '扫码功能', icon: 'none' })}
      />

      <SectionHeader title="上一批记录" />
      <DataForm title="B2026061701" items={lastInfo} />

      <SectionHeader title="历史投料记录" extra="查看全部" />
      <RecordList records={recordList} />
    </ScrollView>
  );
};

export default FeedingDetailPage;
