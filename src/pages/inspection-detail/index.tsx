import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import { inspectionRecords, qualityNameMap } from '@/data/mockData';
import type { QualityResult } from '@/types';

const InspectionDetailPage: React.FC = () => {
  const last = inspectionRecords[0];
  const overall = qualityNameMap[last.overallResult];
  const oxidation = qualityNameMap[last.surfaceOxidation as QualityResult] || qualityNameMap.pass;

  const handleSubmit = () => {
    console.log('[InspectionDetail] 提交记录');
    Taro.showToast({ title: '检验完成', icon: 'success' });
  };

  const recordList: ListItem[] = inspectionRecords.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.inspector,
    statusType: r.overallResult,
    statusText: qualityNameMap[r.overallResult].text,
    data: [
      { label: '过磅重量', value: `${r.weighbridgeWeight} kg` },
      { label: '电阻率', value: `${r.resistivity.toFixed(5)}` }
    ]
  }));

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>成品检验</Text>
        <Text className={styles.desc}>表面氧化检查 · 电阻率检测 · 成品过磅</Text>
        <View className={styles.resultBox}>
          <Text className={styles.resultText} style={{ color: last.overallResult === 'pass' ? '#86EFAC' : '#FCA5A5' }}>
            {overall.text}
          </Text>
          <Text className={styles.resultLabel}>综合判定结果</Text>
          <View className={styles.batchInfo}>
            <Text>批次 {last.batchNo} · 检验员 {last.inspector}</Text>
          </View>
        </View>
      </View>

      <View className={styles.inspectionItems}>
        <View className={`${styles.inspectCard} ${last.surfaceOxidation === 'fail' ? styles.fail : ''}`}>
          <View className={styles.head}>
            <Text className={styles.name}>① 表面氧化检查</Text>
            <View className={`${styles.tag} ${styles[last.surfaceOxidation === 'fail' ? 'warn' : 'pass']}`}>
              {oxidation.text}
            </View>
          </View>
          <View className={styles.content}>
            <View className={styles.valueBox}>
              <Text className={styles.v} style={{ color: oxidation.color }}>
                {last.surfaceOxidation === 'pass' ? '合格' : '观察'}
              </Text>
              <Text className={styles.t}>{last.oxidationDetail || '表面光洁，无氧化斑'}</Text>
            </View>
          </View>
        </View>

        <View className={`${styles.inspectCard}`}>
          <View className={styles.head}>
            <Text className={styles.name}>② 电阻率检测</Text>
            <View className={`${styles.tag} ${last.resistivity <= last.resistivityStandard ? styles.pass : styles.fail}`}>
              {last.resistivity <= last.resistivityStandard ? '合格' : '超差'}
            </View>
          </View>
          <View className={styles.content}>
            <View className={styles.valueBox}>
              <Text className={styles.v}>{last.resistivity.toFixed(5)}</Text>
              <Text className={styles.u}>Ω·mm²/m</Text>
              <Text className={styles.t}>
                标准 ≤ {last.resistivityStandard.toFixed(5)}
                {last.resistivity <= last.resistivityStandard ? ' · 满足要求' : ' · 超出标准'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.weighCard}>
        <View className={styles.title}>
          <View className={styles.bar}></View>
          <Text>③ 成品过磅</Text>
        </View>
        <View className={styles.weightMain}>
          <Text className={styles.wv}>{last.weighbridgeWeight}</Text>
          <Text className={styles.wu}>kg</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>过磅批次</Text>
          <Text className={styles.v}>{last.batchNo}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>过磅时间</Text>
          <Text className={styles.v}>{last.createTime.slice(5)}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>司磅员</Text>
          <Text className={styles.v}>{last.operator}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>理论重量</Text>
          <Text className={styles.v}>{(last.weighbridgeWeight * 1.005).toFixed(1)} kg</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.k}>偏差率</Text>
          <Text className={styles.v} style={{ color: '#10B981' }}>-0.5% (正常)</Text>
        </View>
      </View>

      <SectionHeader title="历史检验记录" />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button className={styles.btnSecondary} onClick={() => Taro.showToast({ title: '打印标签', icon: 'none' })}>
          打印标签
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交检验报告</Button>
      </View>
    </ScrollView>
  );
};

export default InspectionDetailPage;
