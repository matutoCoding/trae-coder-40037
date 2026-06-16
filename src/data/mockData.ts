import type {
  ModuleStatus,
  FeedingRecord,
  MeltingRecord,
  FurnaceRecord,
  CastingRecord,
  RollingRecord,
  PicklingRecord,
  InspectionRecord,
  ProductionStats,
  UserInfo,
  TempPoint,
  ChartDataItem
} from '@/types';

export const moduleStatusList: ModuleStatus[] = [
  {
    key: 'feeding',
    name: '阴极铜投料',
    status: 'running',
    description: '阴极铜上料系统运行中',
    currentValue: '12.5',
    targetValue: '12.0',
    unit: 't/h',
    updateTime: '2026-06-17 14:32:15'
  },
  {
    key: 'melting',
    name: '竖炉熔化',
    status: 'running',
    description: '竖炉温度正常',
    currentValue: '1185',
    targetValue: '1180',
    unit: '℃',
    updateTime: '2026-06-17 14:32:18'
  },
  {
    key: 'furnace',
    name: '保温炉',
    status: 'warning',
    description: '液位略低，注意补料',
    currentValue: '72',
    targetValue: '80',
    unit: '%',
    updateTime: '2026-06-17 14:32:10'
  },
  {
    key: 'casting',
    name: '连铸成型',
    status: 'running',
    description: '连铸轮运行正常',
    currentValue: '8.2',
    targetValue: '8.0',
    unit: 'm/min',
    updateTime: '2026-06-17 14:32:12'
  },
  {
    key: 'rolling',
    name: '连轧拉拔',
    status: 'running',
    description: '连轧机运行正常',
    currentValue: '8.05',
    targetValue: '8.00',
    unit: 'mm',
    updateTime: '2026-06-17 14:32:20'
  },
  {
    key: 'pickling',
    name: '酸洗成圈',
    status: 'running',
    description: '酸洗钝化正常',
    currentValue: '185',
    targetValue: '180',
    unit: 'kg/卷',
    updateTime: '2026-06-17 14:32:08'
  },
  {
    key: 'inspection',
    name: '成品检验',
    status: 'standby',
    description: '待检验队列正常',
    currentValue: '98.6',
    targetValue: '≥98',
    unit: '%',
    updateTime: '2026-06-17 14:30:00'
  }
];

export const feedingRecords: FeedingRecord[] = [
  {
    id: 'F001',
    batchNo: 'B2026061701',
    createTime: '2026-06-17 14:20:00',
    operator: '张建国',
    shift: 'afternoon',
    cathodeCopperWeight: 2500,
    materialGrade: 'A级阴极铜',
    supplier: '江西铜业',
    feedingTime: '2026-06-17 14:15:00'
  },
  {
    id: 'F002',
    batchNo: 'B2026061702',
    createTime: '2026-06-17 13:40:00',
    operator: '李卫东',
    shift: 'afternoon',
    cathodeCopperWeight: 2480,
    materialGrade: 'A级阴极铜',
    supplier: '云南铜业',
    feedingTime: '2026-06-17 13:35:00'
  },
  {
    id: 'F003',
    batchNo: 'B2026061703',
    createTime: '2026-06-17 13:00:00',
    operator: '张建国',
    shift: 'afternoon',
    cathodeCopperWeight: 2520,
    materialGrade: 'A级阴极铜',
    supplier: '江西铜业',
    feedingTime: '2026-06-17 12:55:00'
  },
  {
    id: 'F004',
    batchNo: 'B2026061704',
    createTime: '2026-06-17 12:20:00',
    operator: '王明辉',
    shift: 'morning',
    cathodeCopperWeight: 2490,
    materialGrade: 'A级阴极铜',
    supplier: '铜陵有色',
    feedingTime: '2026-06-17 12:15:00'
  },
  {
    id: 'F005',
    batchNo: 'B2026061705',
    createTime: '2026-06-17 11:40:00',
    operator: '王明辉',
    shift: 'morning',
    cathodeCopperWeight: 2510,
    materialGrade: 'A级阴极铜',
    supplier: '江西铜业',
    feedingTime: '2026-06-17 11:35:00'
  }
];

export const meltingRecords: MeltingRecord[] = [
  {
    id: 'M001',
    batchNo: 'B2026061701',
    createTime: '2026-06-17 14:30:00',
    operator: '刘振华',
    shift: 'afternoon',
    furnaceNo: '1#竖炉',
    meltingTemp: 1186,
    targetTemp: 1180,
    fuelConsumption: 85.6,
    meltingDuration: 45
  },
  {
    id: 'M002',
    batchNo: 'B2026061702',
    createTime: '2026-06-17 13:50:00',
    operator: '刘振华',
    shift: 'afternoon',
    furnaceNo: '1#竖炉',
    meltingTemp: 1178,
    targetTemp: 1180,
    fuelConsumption: 84.2,
    meltingDuration: 43
  },
  {
    id: 'M003',
    batchNo: 'B2026061703',
    createTime: '2026-06-17 13:10:00',
    operator: '赵海涛',
    shift: 'morning',
    furnaceNo: '1#竖炉',
    meltingTemp: 1182,
    targetTemp: 1180,
    fuelConsumption: 85.1,
    meltingDuration: 44
  },
  {
    id: 'M004',
    batchNo: 'B2026061704',
    createTime: '2026-06-17 12:30:00',
    operator: '赵海涛',
    shift: 'morning',
    meltingTemp: 1185,
    targetTemp: 1180,
    fuelConsumption: 86.0,
    meltingDuration: 46,
    furnaceNo: '1#竖炉'
  }
];

export const furnaceRecords: FurnaceRecord[] = [
  {
    id: 'FU001',
    batchNo: 'B2026061701',
    createTime: '2026-06-17 14:32:00',
    operator: '孙志远',
    shift: 'afternoon',
    furnaceNo: '1#保温炉',
    liquidLevel: 72,
    liquidLevelTarget: 80,
    holdingTemp: 1168,
    holdingTempTarget: 1165
  },
  {
    id: 'FU002',
    batchNo: 'B2026061702',
    createTime: '2026-06-17 14:02:00',
    operator: '孙志远',
    shift: 'afternoon',
    furnaceNo: '1#保温炉',
    liquidLevel: 78,
    liquidLevelTarget: 80,
    holdingTemp: 1166,
    holdingTempTarget: 1165
  },
  {
    id: 'FU003',
    batchNo: 'B2026061703',
    createTime: '2026-06-17 13:22:00',
    operator: '周国强',
    shift: 'morning',
    furnaceNo: '1#保温炉',
    liquidLevel: 82,
    liquidLevelTarget: 80,
    holdingTemp: 1164,
    holdingTempTarget: 1165
  },
  {
    id: 'FU004',
    batchNo: 'B2026061704',
    createTime: '2026-06-17 12:42:00',
    operator: '周国强',
    shift: 'morning',
    furnaceNo: '1#保温炉',
    liquidLevel: 85,
    liquidLevelTarget: 80,
    holdingTemp: 1167,
    holdingTempTarget: 1165
  }
];

export const castingRecords: CastingRecord[] = [
  {
    id: 'C001',
    batchNo: 'B2026061701',
    createTime: '2026-06-17 14:35:00',
    operator: '吴建军',
    shift: 'afternoon',
    castingWheelSpeed: 8.2,
    castingTemp: 1158,
    billetTemp: 920,
    billetSize: '125mm×125mm',
    castingLength: 360
  },
  {
    id: 'C002',
    batchNo: 'B2026061702',
    createTime: '2026-06-17 13:55:00',
    operator: '吴建军',
    shift: 'afternoon',
    castingWheelSpeed: 8.0,
    castingTemp: 1156,
    billetTemp: 915,
    billetSize: '125mm×125mm',
    castingLength: 355
  },
  {
    id: 'C003',
    batchNo: 'B2026061703',
    createTime: '2026-06-17 13:15:00',
    operator: '郑浩然',
    shift: 'morning',
    castingWheelSpeed: 8.1,
    castingTemp: 1157,
    billetTemp: 918,
    billetSize: '125mm×125mm',
    castingLength: 358
  },
  {
    id: 'C004',
    batchNo: 'B2026061704',
    createTime: '2026-06-17 12:35:00',
    operator: '郑浩然',
    shift: 'morning',
    castingWheelSpeed: 8.0,
    castingTemp: 1155,
    billetTemp: 912,
    billetSize: '125mm×125mm',
    castingLength: 352
  }
];

export const rollingRecords: RollingRecord[] = [
  {
    id: 'R001',
    batchNo: 'B2026061701',
    createTime: '2026-06-17 14:40:00',
    operator: '马晓东',
    shift: 'afternoon',
    millNo: '1#连轧机',
    rollingSpeed: 12.5,
    inletTemp: 905,
    outletTemp: 580,
    rodDiameter: 8.05,
    diameterTolerance: 0.05,
    rollingForce: 1250
  },
  {
    id: 'R002',
    batchNo: 'B2026061702',
    createTime: '2026-06-17 14:00:00',
    operator: '马晓东',
    shift: 'afternoon',
    millNo: '1#连轧机',
    rollingSpeed: 12.4,
    inletTemp: 900,
    outletTemp: 575,
    rodDiameter: 8.02,
    diameterTolerance: 0.02,
    rollingForce: 1235
  },
  {
    id: 'R003',
    batchNo: 'B2026061703',
    createTime: '2026-06-17 13:20:00',
    operator: '黄勇刚',
    shift: 'morning',
    millNo: '1#连轧机',
    rollingSpeed: 12.6,
    inletTemp: 902,
    outletTemp: 578,
    rodDiameter: 8.00,
    diameterTolerance: 0.00,
    rollingForce: 1242
  },
  {
    id: 'R004',
    batchNo: 'B2026061704',
    createTime: '2026-06-17 12:40:00',
    operator: '黄勇刚',
    shift: 'morning',
    millNo: '1#连轧机',
    rollingSpeed: 12.3,
    inletTemp: 898,
    outletTemp: 572,
    rodDiameter: 7.98,
    diameterTolerance: -0.02,
    rollingForce: 1228
  }
];

export const picklingRecords: PicklingRecord[] = [
  {
    id: 'P001',
    batchNo: 'B2026061701',
    createTime: '2026-06-17 14:45:00',
    operator: '徐立伟',
    shift: 'afternoon',
    acidConcentration: 12.5,
    acidTemp: 42,
    picklingSpeed: 6.5,
    passivationTime: 15,
    coilerNo: '1#卷取机',
    coilWeight: 185.5,
    coilDiameter: 1250
  },
  {
    id: 'P002',
    batchNo: 'B2026061702',
    createTime: '2026-06-17 14:05:00',
    operator: '徐立伟',
    shift: 'afternoon',
    acidConcentration: 12.3,
    acidTemp: 41,
    picklingSpeed: 6.4,
    passivationTime: 14,
    coilerNo: '1#卷取机',
    coilWeight: 182.8,
    coilDiameter: 1245
  },
  {
    id: 'P003',
    batchNo: 'B2026061703',
    createTime: '2026-06-17 13:25:00',
    operator: '韩鹏飞',
    shift: 'morning',
    acidConcentration: 12.6,
    acidTemp: 43,
    picklingSpeed: 6.6,
    passivationTime: 15,
    coilerNo: '1#卷取机',
    coilWeight: 186.2,
    coilDiameter: 1252
  },
  {
    id: 'P004',
    batchNo: 'B2026061704',
    createTime: '2026-06-17 12:45:00',
    operator: '韩鹏飞',
    shift: 'morning',
    acidConcentration: 12.4,
    acidTemp: 42,
    picklingSpeed: 6.5,
    passivationTime: 14,
    coilerNo: '1#卷取机',
    coilWeight: 184.0,
    coilDiameter: 1248
  }
];

export const inspectionRecords: InspectionRecord[] = [
  {
    id: 'I001',
    batchNo: 'B2026061701',
    createTime: '2026-06-17 14:50:00',
    operator: '林志强',
    shift: 'afternoon',
    surfaceOxidation: 'pass',
    oxidationDetail: '表面光洁，无明显氧化斑',
    resistivity: 0.01712,
    resistivityStandard: 0.01724,
    weighbridgeWeight: 185.2,
    overallResult: 'pass',
    inspector: '林志强'
  },
  {
    id: 'I002',
    batchNo: 'B2026061702',
    createTime: '2026-06-17 14:10:00',
    operator: '林志强',
    shift: 'afternoon',
    surfaceOxidation: 'pass',
    oxidationDetail: '表面质量良好',
    resistivity: 0.01715,
    resistivityStandard: 0.01724,
    weighbridgeWeight: 182.5,
    overallResult: 'pass',
    inspector: '林志强'
  },
  {
    id: 'I003',
    batchNo: 'B2026061703',
    createTime: '2026-06-17 13:30:00',
    operator: '陈伟华',
    shift: 'morning',
    surfaceOxidation: 'pass',
    oxidationDetail: '表面光洁度达标',
    resistivity: 0.01710,
    resistivityStandard: 0.01724,
    weighbridgeWeight: 185.8,
    overallResult: 'pass',
    inspector: '陈伟华'
  },
  {
    id: 'I004',
    batchNo: 'B2026061704',
    createTime: '2026-06-17 12:50:00',
    operator: '陈伟华',
    shift: 'morning',
    surfaceOxidation: 'warning' as any,
    oxidationDetail: '局部轻微氧化，已做降级处理',
    resistivity: 0.01718,
    resistivityStandard: 0.01724,
    weighbridgeWeight: 183.6,
    overallResult: 'pass',
    inspector: '陈伟华'
  }
];

export const productionStatsList: ProductionStats[] = [
  {
    date: '2026-06-17',
    shift: 'afternoon',
    feedingWeight: 10000,
    meltingOutput: 9850,
    castingOutput: 9720,
    rollingOutput: 9600,
    finishedWeight: 9480,
    passRate: 98.6,
    runningHours: 6.5
  },
  {
    date: '2026-06-17',
    shift: 'morning',
    feedingWeight: 12500,
    meltingOutput: 12320,
    castingOutput: 12180,
    rollingOutput: 12020,
    finishedWeight: 11880,
    passRate: 98.9,
    runningHours: 8.0
  },
  {
    date: '2026-06-16',
    shift: 'night',
    feedingWeight: 11000,
    meltingOutput: 10830,
    castingOutput: 10690,
    rollingOutput: 10540,
    finishedWeight: 10400,
    passRate: 98.2,
    runningHours: 7.5
  },
  {
    date: '2026-06-16',
    shift: 'afternoon',
    feedingWeight: 12200,
    meltingOutput: 12040,
    castingOutput: 11890,
    rollingOutput: 11730,
    finishedWeight: 11590,
    passRate: 98.7,
    runningHours: 7.8
  },
  {
    date: '2026-06-16',
    shift: 'morning',
    feedingWeight: 12800,
    meltingOutput: 12620,
    castingOutput: 12460,
    rollingOutput: 12300,
    finishedWeight: 12150,
    passRate: 99.0,
    runningHours: 8.0
  },
  {
    date: '2026-06-15',
    shift: 'night',
    feedingWeight: 10500,
    meltingOutput: 10330,
    castingOutput: 10180,
    rollingOutput: 10040,
    finishedWeight: 9900,
    passRate: 97.8,
    runningHours: 7.0
  },
  {
    date: '2026-06-15',
    shift: 'afternoon',
    feedingWeight: 12000,
    meltingOutput: 11840,
    castingOutput: 11690,
    rollingOutput: 11540,
    finishedWeight: 11400,
    passRate: 98.5,
    runningHours: 7.6
  }
];

export const currentUser: UserInfo = {
  name: '张建国',
  employeeId: 'EMP20230015',
  position: '车间主任',
  department: '铜杆连铸车间',
  phone: '138****6688',
  currentShift: 'afternoon'
};

export const temperatureTrend: TempPoint[] = [
  { time: '08:00', value: 1175 },
  { time: '09:00', value: 1178 },
  { time: '10:00', value: 1180 },
  { time: '11:00', value: 1182 },
  { time: '12:00', value: 1185 },
  { time: '13:00', value: 1183 },
  { time: '14:00', value: 1186 }
];

export const dailyOutputChart: ChartDataItem[] = [
  { label: '6/11', value: 33.8 },
  { label: '6/12', value: 34.5 },
  { label: '6/13', value: 33.2 },
  { label: '6/14', value: 34.0 },
  { label: '6/15', value: 33.5 },
  { label: '6/16', value: 35.2 },
  { label: '6/17', value: 21.4 }
];

export const passRateChart: ChartDataItem[] = [
  { label: '6/11', value: 98.2 },
  { label: '6/12', value: 98.6 },
  { label: '6/13', value: 97.8 },
  { label: '6/14', value: 98.5 },
  { label: '6/15', value: 98.0 },
  { label: '6/16', value: 98.8 },
  { label: '6/17', value: 98.6 }
];

export const shiftNameMap: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  night: '晚班'
};

export const statusNameMap: Record<string, { text: string; color: string }> = {
  running: { text: '运行中', color: '#10B981' },
  warning: { text: '注意', color: '#F59E0B' },
  stopped: { text: '停机', color: '#EF4444' },
  standby: { text: '待机', color: '#6B7280' }
};

export const qualityNameMap: Record<string, { text: string; color: string }> = {
  pass: { text: '合格', color: '#10B981' },
  fail: { text: '不合格', color: '#EF4444' },
  pending: { text: '待检', color: '#6B7280' }
};
