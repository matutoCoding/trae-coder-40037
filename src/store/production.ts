import { create } from 'zustand';
import type {
  FeedingRecord,
  MeltingRecord,
  FurnaceRecord,
  CastingRecord,
  RollingRecord,
  PicklingRecord,
  InspectionRecord,
  ModuleStatus,
  ProductionStats,
  ChartDataItem,
  DeviceStatus,
  TempPoint
} from '@/types';
import {
  moduleStatusList as initModuleStatus,
  feedingRecords as initFeeding,
  meltingRecords as initMelting,
  furnaceRecords as initFurnace,
  castingRecords as initCasting,
  rollingRecords as initRolling,
  picklingRecords as initPickling,
  inspectionRecords as initInspection,
  productionStatsList as initStats,
  dailyOutputChart as initDailyOutput,
  passRateChart as initPassRate,
  temperatureTrend as initTempTrend,
  currentUser
} from '@/data/mockData';

export interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  moduleKey: string;
  createTime: string;
  isHandled: boolean;
  handleTime?: string;
  handler?: string;
  handleMeasure?: string;
}

type RecordsByKey = {
  feeding: FeedingRecord[];
  melting: MeltingRecord[];
  furnace: FurnaceRecord[];
  casting: CastingRecord[];
  rolling: RollingRecord[];
  pickling: PicklingRecord[];
  inspection: InspectionRecord[];
};

export type RecordKey = keyof RecordsByKey;

interface ProductionState {
  moduleStatus: ModuleStatus[];
  records: RecordsByKey;
  productionStats: ProductionStats[];
  dailyOutputChart: ChartDataItem[];
  passRateChart: ChartDataItem[];
  temperatureTrend: TempPoint[];
  alerts: AlertItem[];
  currentBatchNos: string[];

  addFeedingRecord: (record: Omit<FeedingRecord, 'id' | 'createTime' | 'operator' | 'shift'> & Partial<Pick<FeedingRecord, 'id' | 'createTime' | 'operator' | 'shift'>>) => void;
  addMeltingRecord: (record: Partial<MeltingRecord> & Pick<MeltingRecord, 'furnaceNo' | 'meltingTemp' | 'targetTemp'>) => void;
  addFurnaceRecord: (record: Partial<FurnaceRecord> & Pick<FurnaceRecord, 'furnaceNo' | 'liquidLevel' | 'holdingTemp'>) => void;
  addCastingRecord: (record: Partial<CastingRecord> & Pick<CastingRecord, 'castingWheelSpeed' | 'castingTemp' | 'billetTemp'>) => void;
  addRollingRecord: (record: Partial<RollingRecord> & Pick<RollingRecord, 'millNo' | 'rodDiameter' | 'rollingSpeed'>) => void;
  addPicklingRecord: (record: Partial<PicklingRecord> & Pick<PicklingRecord, 'coilerNo' | 'coilWeight' | 'acidConcentration'>) => void;
  addInspectionRecord: (record: Partial<InspectionRecord> & Pick<InspectionRecord, 'surfaceOxidation' | 'resistivity' | 'weighbridgeWeight' | 'overallResult'>) => void;

  updateModuleStatus: (key: string, updates: Partial<ModuleStatus>) => void;
  setModuleStatusValue: (key: string, currentValue: string) => void;

  handleAlert: (alertId: string, handleMeasure: string) => void;

  getNextBatchNo: () => string;
  getBatchTrace: (batchNo: string) => {
    feeding?: FeedingRecord;
    melting?: MeltingRecord;
    furnace?: FurnaceRecord;
    casting?: CastingRecord;
    rolling?: RollingRecord;
    pickling?: PicklingRecord;
    inspection?: InspectionRecord;
  }[];

  getReportsByDateRange: (range: '7d' | '30d' | 'month') => {
    stats: ProductionStats[];
    outputChart: ChartDataItem[];
    passRateChart: ChartDataItem[];
    summary: {
      totalOutput: number;
      avgPassRate: number;
      totalHours: number;
      totalFeed: number;
    };
  };

  getFilteredModules: (moduleKey: string, statusFilter: string) => ModuleStatus[];
}

const genId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
const nowStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const initAlerts: AlertItem[] = [
  {
    id: 'A001',
    type: 'warning',
    title: '1#保温炉液位偏低',
    message: '当前液位 72%，建议及时补铜液',
    moduleKey: 'furnace',
    createTime: '2026-06-17 14:10:00',
    isHandled: false
  },
  {
    id: 'A002',
    type: 'info',
    title: 'B2026061704批次待检',
    message: '已等待15分钟，请及时安排检验',
    moduleKey: 'inspection',
    createTime: '2026-06-17 14:05:00',
    isHandled: false
  },
  {
    id: 'A003',
    type: 'error',
    title: '酸液浓度接近下限',
    message: '当前浓度12.3%，建议补充酸液',
    moduleKey: 'pickling',
    createTime: '2026-06-17 13:55:00',
    isHandled: false
  }
];

const extractBatchNos = (
  feeding: FeedingRecord[],
  melting: MeltingRecord[],
  furnace: FurnaceRecord[],
  casting: CastingRecord[],
  rolling: RollingRecord[],
  pickling: PicklingRecord[],
  inspection: InspectionRecord[]
): string[] => {
  const set = new Set<string>();
  [...feeding, ...melting, ...furnace, ...casting, ...rolling, ...pickling, ...inspection].forEach((r) => set.add(r.batchNo));
  return Array.from(set).sort().reverse();
};

const refreshBatchNos = (state: { records: RecordsByKey }): string[] => {
  const r = state.records;
  return extractBatchNos(r.feeding, r.melting, r.furnace, r.casting, r.rolling, r.pickling, r.inspection);
};

const generateExtendedStats = (baseStats: ProductionStats[], days: number): ProductionStats[] => {
  const result: ProductionStats[] = [];
  const today = new Date('2026-06-17');
  const shifts: Array<'morning' | 'afternoon' | 'night'> = ['morning', 'afternoon', 'night'];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const existing = baseStats.filter((s) => s.date === dateStr);
    shifts.forEach((shift, idx) => {
      const found = existing.find((e) => e.shift === shift);
      if (found) {
        result.push(found);
      } else {
        const factor = 0.95 + Math.random() * 0.1;
        const baseFeed = 10000 + Math.floor(Math.random() * 3000);
        const feed = Math.floor(baseFeed * factor);
        const pass = 97.5 + Math.random() * 1.8;
        result.push({
          date: dateStr,
          shift,
          feedingWeight: feed,
          meltingOutput: Math.floor(feed * 0.985),
          castingOutput: Math.floor(feed * 0.97),
          rollingOutput: Math.floor(feed * 0.955),
          finishedWeight: Math.floor(feed * 0.94),
          passRate: Number(pass.toFixed(1)),
          runningHours: Number((7.0 + Math.random() * 1.2).toFixed(1))
        });
      }
      void idx;
    });
  }
  return result;
};

const generateChartFromStats = (stats: ProductionStats[], key: 'output' | 'passRate', range: '7d' | '30d' | 'month' = '7d'): ChartDataItem[] => {
  const byDate = new Map<string, { output: number; rates: number[]; count: number }>();
  stats.forEach((s) => {
    const prev = byDate.get(s.date) || { output: 0, rates: [], count: 0 };
    prev.output += s.finishedWeight;
    prev.rates.push(s.passRate);
    prev.count += 1;
    byDate.set(s.date, prev);
  });
  const items: ChartDataItem[] = [];
  byDate.forEach((v, k) => {
    const label = `${k.slice(5).replace('-', '/')}`;
    if (key === 'output') {
      items.push({ label, value: Number((v.output / 1000).toFixed(1)) });
    } else {
      const avg = v.rates.reduce((a, b) => a + b, 0) / v.rates.length;
      items.push({ label, value: Number(avg.toFixed(1)) });
    }
  });
  const sliceCount = range === '7d' ? 7 : range === '30d' ? 30 : new Date().getDate();
  return items.slice(-sliceCount);
};

export const useProductionStore = create<ProductionState>((set, get) => ({
  moduleStatus: [...initModuleStatus],
  records: {
    feeding: [...initFeeding],
    melting: [...initMelting],
    furnace: [...initFurnace],
    casting: [...initCasting],
    rolling: [...initRolling],
    pickling: [...initPickling],
    inspection: [...initInspection]
  },
  productionStats: [...initStats],
  dailyOutputChart: [...initDailyOutput],
  passRateChart: [...initPassRate],
  temperatureTrend: [...initTempTrend],
  alerts: [...initAlerts],
  currentBatchNos: extractBatchNos(initFeeding, initMelting, initFurnace, initCasting, initRolling, initPickling, initInspection),

  getNextBatchNo: () => {
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const records = get().records;
    const todayRecords = [
      ...records.feeding,
      ...records.melting,
      ...records.furnace,
      ...records.casting,
      ...records.rolling,
      ...records.pickling,
      ...records.inspection
    ].filter((r) => r.batchNo.includes(datePart));
    const nextSeq = String(todayRecords.length + 1).padStart(2, '0');
    return `B${datePart}${nextSeq}`;
  },

  addFeedingRecord: (record) => {
    const batchNo = record.batchNo || get().getNextBatchNo();
    const newRec: FeedingRecord = {
      id: record.id || genId('F'),
      batchNo,
      createTime: record.createTime || nowStr(),
      operator: record.operator || currentUser.name,
      shift: record.shift || currentUser.currentShift,
      cathodeCopperWeight: record.cathodeCopperWeight,
      materialGrade: record.materialGrade || 'A级阴极铜',
      supplier: record.supplier || '江西铜业',
      feedingTime: record.feedingTime || nowStr()
    };
    set((state) => {
      const newFeeding = [newRec, ...state.records.feeding];
      const newRecords = { ...state.records, feeding: newFeeding };
      const ms = state.moduleStatus.map((m) =>
        m.key === 'feeding'
          ? { ...m, currentValue: ((newFeeding.slice(0, 5).reduce((s, r) => s + r.cathodeCopperWeight, 0) / 1000).toFixed(1)), updateTime: nowStr() }
          : m
      );
      return {
        records: newRecords,
        moduleStatus: ms,
        currentBatchNos: refreshBatchNos({ records: newRecords })
      };
    });
  },

  addMeltingRecord: (record) => {
    const batchNo = record.batchNo || get().getNextBatchNo();
    const newRec: MeltingRecord = {
      id: record.id || genId('M'),
      batchNo,
      createTime: nowStr(),
      operator: currentUser.name,
      shift: currentUser.currentShift,
      furnaceNo: record.furnaceNo,
      meltingTemp: record.meltingTemp,
      targetTemp: record.targetTemp,
      fuelConsumption: record.fuelConsumption || 85.0,
      meltingDuration: record.meltingDuration || 45
    };
    set((state) => {
      const newMelting = [newRec, ...state.records.melting];
      const newRecords = { ...state.records, melting: newMelting };
      const ms = state.moduleStatus.map((m) =>
        m.key === 'melting'
          ? { ...m, currentValue: String(record.meltingTemp), updateTime: nowStr(), status: record.meltingTemp < 1170 ? 'warning' : 'running' as DeviceStatus }
          : m
      );
      const tt = [...state.temperatureTrend];
      const now = new Date();
      tt.push({ time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, value: record.meltingTemp });
      while (tt.length > 10) tt.shift();
      return {
        records: newRecords,
        moduleStatus: ms,
        temperatureTrend: tt,
        currentBatchNos: refreshBatchNos({ records: newRecords })
      };
    });
  },

  addFurnaceRecord: (record) => {
    const batchNo = record.batchNo || get().getNextBatchNo();
    const newRec: FurnaceRecord = {
      id: genId('FU'),
      batchNo,
      createTime: nowStr(),
      operator: currentUser.name,
      shift: currentUser.currentShift,
      furnaceNo: record.furnaceNo,
      liquidLevel: record.liquidLevel,
      liquidLevelTarget: record.liquidLevelTarget || 80,
      holdingTemp: record.holdingTemp,
      holdingTempTarget: record.holdingTempTarget || 1165
    };
    set((state) => {
      const newFurnace = [newRec, ...state.records.furnace];
      const newRecords = { ...state.records, furnace: newFurnace };
      const ms = state.moduleStatus.map((m) =>
        m.key === 'furnace'
          ? { ...m, currentValue: String(record.liquidLevel), updateTime: nowStr(), status: record.liquidLevel < 75 ? 'warning' : 'running' as DeviceStatus, description: record.liquidLevel < 75 ? '液位偏低，注意补料' : '保温炉液位正常' }
          : m
      );
      return {
        records: newRecords,
        moduleStatus: ms,
        currentBatchNos: refreshBatchNos({ records: newRecords })
      };
    });
  },

  addCastingRecord: (record) => {
    const batchNo = record.batchNo || get().getNextBatchNo();
    const newRec: CastingRecord = {
      id: genId('C'),
      batchNo,
      createTime: nowStr(),
      operator: currentUser.name,
      shift: currentUser.currentShift,
      castingWheelSpeed: record.castingWheelSpeed,
      castingTemp: record.castingTemp,
      billetTemp: record.billetTemp,
      billetSize: record.billetSize || '125mm×125mm',
      castingLength: record.castingLength || 360
    };
    set((state) => {
      const newCasting = [newRec, ...state.records.casting];
      const newRecords = { ...state.records, casting: newCasting };
      const ms = state.moduleStatus.map((m) =>
        m.key === 'casting'
          ? { ...m, currentValue: String(record.castingWheelSpeed), updateTime: nowStr() }
          : m
      );
      return {
        records: newRecords,
        moduleStatus: ms,
        currentBatchNos: refreshBatchNos({ records: newRecords })
      };
    });
  },

  addRollingRecord: (record) => {
    const batchNo = record.batchNo || get().getNextBatchNo();
    const newRec: RollingRecord = {
      id: genId('R'),
      batchNo,
      createTime: nowStr(),
      operator: currentUser.name,
      shift: currentUser.currentShift,
      millNo: record.millNo,
      rollingSpeed: record.rollingSpeed,
      inletTemp: record.inletTemp || 900,
      outletTemp: record.outletTemp || 575,
      rodDiameter: record.rodDiameter,
      diameterTolerance: Number((record.rodDiameter - 8.0).toFixed(2)),
      rollingForce: record.rollingForce || 1250
    };
    set((state) => {
      const newRolling = [newRec, ...state.records.rolling];
      const newRecords = { ...state.records, rolling: newRolling };
      const ms = state.moduleStatus.map((m) =>
        m.key === 'rolling'
          ? { ...m, currentValue: String(record.rodDiameter), updateTime: nowStr(), status: Math.abs(newRec.diameterTolerance) > 0.05 ? 'warning' : 'running' as DeviceStatus }
          : m
      );
      return {
        records: newRecords,
        moduleStatus: ms,
        currentBatchNos: refreshBatchNos({ records: newRecords })
      };
    });
  },

  addPicklingRecord: (record) => {
    const batchNo = record.batchNo || get().getNextBatchNo();
    const newRec: PicklingRecord = {
      id: genId('P'),
      batchNo,
      createTime: nowStr(),
      operator: currentUser.name,
      shift: currentUser.currentShift,
      acidConcentration: record.acidConcentration,
      acidTemp: record.acidTemp || 42,
      picklingSpeed: record.picklingSpeed || 6.5,
      passivationTime: record.passivationTime || 15,
      coilerNo: record.coilerNo,
      coilWeight: record.coilWeight,
      coilDiameter: record.coilDiameter || 1250
    };
    set((state) => {
      const newPickling = [newRec, ...state.records.pickling];
      const newRecords = { ...state.records, pickling: newPickling };
      const ms = state.moduleStatus.map((m) =>
        m.key === 'pickling'
          ? { ...m, currentValue: String(record.coilWeight), updateTime: nowStr(), status: record.acidConcentration < 12.0 ? 'warning' : 'running' as DeviceStatus, description: record.acidConcentration < 12.0 ? '酸浓度偏低，注意补酸' : '酸洗钝化正常' }
          : m
      );
      return {
        records: newRecords,
        moduleStatus: ms,
        currentBatchNos: refreshBatchNos({ records: newRecords })
      };
    });
  },

  addInspectionRecord: (record) => {
    const batchNo = record.batchNo || get().getNextBatchNo();
    const newRec: InspectionRecord = {
      id: genId('I'),
      batchNo,
      createTime: nowStr(),
      operator: currentUser.name,
      shift: currentUser.currentShift,
      surfaceOxidation: record.surfaceOxidation,
      oxidationDetail: record.oxidationDetail || '表面光洁无氧化',
      resistivity: record.resistivity,
      resistivityStandard: record.resistivityStandard || 0.01724,
      weighbridgeWeight: record.weighbridgeWeight,
      overallResult: record.overallResult,
      inspector: record.inspector || currentUser.name
    };
    set((state) => {
      const newInspection = [newRec, ...state.records.inspection];
      const newRecords = { ...state.records, inspection: newInspection };
      const passCount = newInspection.filter((r) => r.overallResult === 'pass').length;
      const warningCount = newInspection.filter((r) => r.overallResult === 'warning').length;
      const passRateVal = Number((((passCount + warningCount) / newInspection.length) * 100).toFixed(1));
      const ms = state.moduleStatus.map((m) =>
        m.key === 'inspection'
          ? { ...m, currentValue: String(passRateVal), updateTime: nowStr(), description: warningCount > 0 ? `${warningCount}批需关注` : '检验流程正常' }
          : m
      );
      return {
        records: newRecords,
        moduleStatus: ms,
        currentBatchNos: refreshBatchNos({ records: newRecords })
      };
    });
  },

  updateModuleStatus: (key, updates) => {
    set((state) => ({
      moduleStatus: state.moduleStatus.map((m) => (m.key === key ? { ...m, ...updates, updateTime: nowStr() } : m))
    }));
  },

  setModuleStatusValue: (key, currentValue) => {
    set((state) => ({
      moduleStatus: state.moduleStatus.map((m) => (m.key === key ? { ...m, currentValue, updateTime: nowStr() } : m))
    }));
  },

  handleAlert: (alertId, handleMeasure) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? { ...a, isHandled: true, handleTime: nowStr(), handler: currentUser.name, handleMeasure }
          : a
      )
    }));
  },

  getBatchTrace: (batchNo) => {
    const state = get();
    const findIn = <T extends { batchNo: string }>(arr: T[]): T | undefined =>
      arr.find((r) => r.batchNo === batchNo);
    return [
      {
        feeding: findIn(state.records.feeding),
        melting: findIn(state.records.melting),
        furnace: findIn(state.records.furnace),
        casting: findIn(state.records.casting),
        rolling: findIn(state.records.rolling),
        pickling: findIn(state.records.pickling),
        inspection: findIn(state.records.inspection)
      }
    ];
  },

  getReportsByDateRange: (range) => {
    const state = get();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : new Date().getDate();
    const stats = generateExtendedStats(state.productionStats, days);
    const sliceCount = days * 3;
    const clippedStats = stats.slice(-sliceCount);
    const totalOutput = clippedStats.reduce((s, r) => s + r.finishedWeight, 0);
    const totalFeed = clippedStats.reduce((s, r) => s + r.feedingWeight, 0);
    const totalHours = clippedStats.reduce((s, r) => s + r.runningHours, 0);
    const avgPassRate = clippedStats.length > 0 ? clippedStats.reduce((s, r) => s + r.passRate, 0) / clippedStats.length : 0;
    return {
      stats: clippedStats,
      outputChart: generateChartFromStats(clippedStats, 'output', range),
      passRateChart: generateChartFromStats(clippedStats, 'passRate', range),
      summary: {
        totalOutput,
        avgPassRate: Number(avgPassRate.toFixed(1)),
        totalHours: Number(totalHours.toFixed(1)),
        totalFeed
      }
    };
  },

  getFilteredModules: (moduleKey, statusFilter) => {
    const state = get();
    return state.moduleStatus.filter((m) => {
      const moduleMatch = moduleKey === 'all' || m.key === moduleKey;
      let statusMatch = true;
      if (statusFilter === '运行中') statusMatch = m.status === 'running';
      else if (statusFilter === '注意') statusMatch = m.status === 'warning';
      else if (statusFilter === '待机') statusMatch = m.status === 'standby' || m.status === 'stopped';
      return moduleMatch && statusMatch;
    });
  }
}));

void todayStr;
