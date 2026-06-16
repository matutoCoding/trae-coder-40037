import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordList, { ListItem } from '@/components/RecordList';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { picklingRecords, currentUser } from '@/data/mockData';

const PicklingDetailPage: React.FC = () => {
  const last = picklingRecords[0];

  const handleSubmit = () => {
    console.log('[PicklingDetail] 提交记录');
    Taro.showToast({ title: '记录已提交', icon: 'success' });
  };

  const recordList: ListItem[] = picklingRecords.map((r) => ({
    id: r.id,
    batchNo: r.batchNo,
    time: r.createTime.slice(5),
    operator: r.operator,
    statusType: 'pass',
    statusText: '已完成',
    data: [
      { label: '卷重', value: `${r.coilWeight} kg` },
      { label: '酸浓', value: `${r.acidConcentration}%` }
    ]
  }));

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.moduleHeader}>
        <Text className={styles.title}>酸洗成圈</Text>
        <Text className={styles.desc}>酸洗钝化 · 卷取成圈 · 1#卷取机</Text>
        <View className={styles.stats}>
          <View className={styles.statBox}>
            <Text className={styles.v}>{last.acidConcentration}</Text>
            <Text className={styles.l}>酸浓度 %</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{last.picklingSpeed}</Text>
            <Text className={styles.l}>酸洗速度 m/min</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.v}>{last.coilWeight}</Text>
            <Text className={styles.l}>单卷重量 kg</Text>
          </View>
        </View>
      </View>

      <View style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatusBadge type="running" text="酸洗系统运行正常" />
        <StatusBadge type="warning" text="酸浓度偏低 请补酸" />
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>成圈信息</Text>
        </View>
        <View className={styles.coilVisual}>
          <View className={styles.coilCircle}>
            <View className={styles.coilInner}></View>
          </View>
          <View className={styles.coilInfo}>
            <Text className={styles.weight}>{last.coilWeight}</Text>
            <Text className={styles.unit}> kg / 卷</Text>
            <View className={styles.meta}>
              <Text>卷径 Φ{last.coilDiameter}mm · {last.coilerNo}</Text>
            </View>
            <View className={styles.meta}>
              <Text>操作人员: {currentUser.name}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>酸洗钝化参数</Text>
        </View>
        <View className={styles.paramGrid}>
          <View className={styles.paramBox}>
            <Text className={styles.v}>{last.acidConcentration}%</Text>
            <Text className={styles.l}>酸液浓度</Text>
            <Text className={styles.t}>标准 12~15%</Text>
          </View>
          <View className={styles.paramBox}>
            <Text className={styles.v}>{last.acidTemp}℃</Text>
            <Text className={styles.l}>酸液温度</Text>
            <Text className={styles.t}>标准 40~45℃</Text>
          </View>
          <View className={styles.paramBox}>
            <Text className={styles.v}>{last.picklingSpeed}</Text>
            <Text className={styles.l}>酸洗速度 m/min</Text>
            <Text className={styles.t}>标准 6~7 m/min</Text>
          </View>
          <View className={styles.paramBox}>
            <Text className={styles.v}>{last.passivationTime}s</Text>
            <Text className={styles.l}>钝化时间</Text>
            <Text className={styles.t}>标准 12~18 s</Text>
          </View>
        </View>
      </View>

      <View className={styles.infoCard}>
        <View className={styles.cardTitle}>
          <View className={styles.bar}></View>
          <Text>卷取记录详情</Text>
        </View>
        <View className={styles.dataList}>
          <View className={styles.item}>
            <Text className={styles.label}>批次号</Text>
            <Text className={`${styles.value} ${styles.hl}`}>{last.batchNo}</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>卷取机号</Text>
            <Text className={styles.value}>{last.coilerNo}</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>单卷重量</Text>
            <Text className={`${styles.value} ${styles.ok}`}>{last.coilWeight} kg</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>卷径</Text>
            <Text className={styles.value}>Φ {last.coilDiameter} mm</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>操作人</Text>
            <Text className={styles.value}>{last.operator}</Text>
          </View>
          <View className={styles.item}>
            <Text className={styles.label}>记录时间</Text>
            <Text className={styles.value}>{last.createTime.slice(5)}</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="历史成圈记录" />
      <RecordList records={recordList} />

      <View style={{ height: 120 }}></View>
      <View className={styles.fixedBottom}>
        <Button className={styles.btnSecondary} onClick={() => Taro.showToast({ title: '换卷操作', icon: 'none' })}>
          换卷
        </Button>
        <Button className={styles.btnPrimary} onClick={handleSubmit}>提交成圈记录</Button>
      </View>
    </ScrollView>
  );
};

export default PicklingDetailPage;
