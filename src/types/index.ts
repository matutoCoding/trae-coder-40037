export type DeviceStatus = 'running' | 'warning' | 'stopped' | 'standby';
export type ProcessModule = 'feeding' | 'melting' | 'furnace' | 'casting' | 'rolling' | 'pickling' | 'inspection';
export type ShiftType = 'morning' | 'afternoon' | 'night';
export type QualityResult = 'pass' | 'warning' | 'fail' | 'pending';

export interface BaseRecord {
  id: string;
  createTime: string;
  operator: string;
  shift: ShiftType;
  batchNo: string;
  remark?: string;
}

export interface FeedingRecord extends BaseRecord {
  cathodeCopperWeight: number;
  materialGrade: string;
  supplier: string;
  feedingTime: string;
}

export interface MeltingRecord extends BaseRecord {
  furnaceNo: string;
  meltingTemp: number;
  targetTemp: number;
  fuelConsumption: number;
  meltingDuration: number;
}

export interface FurnaceRecord extends BaseRecord {
  furnaceNo: string;
  liquidLevel: number;
  liquidLevelTarget: number;
  holdingTemp: number;
  holdingTempTarget: number;
}

export interface CastingRecord extends BaseRecord {
  castingWheelSpeed: number;
  castingTemp: number;
  billetTemp: number;
  billetSize: string;
  castingLength: number;
}

export interface RollingRecord extends BaseRecord {
  millNo: string;
  rollingSpeed: number;
  inletTemp: number;
  outletTemp: number;
  rodDiameter: number;
  diameterTolerance: number;
  rollingForce: number;
}

export interface PicklingRecord extends BaseRecord {
  acidConcentration: number;
  acidTemp: number;
  picklingSpeed: number;
  passivationTime: number;
  coilerNo: string;
  coilWeight: number;
  coilDiameter: number;
}

export interface InspectionRecord extends BaseRecord {
  surfaceOxidation: QualityResult;
  oxidationDetail?: string;
  resistivity: number;
  resistivityStandard: number;
  weighbridgeWeight: number;
  overallResult: QualityResult;
  inspector: string;
}

export interface ModuleStatus {
  key: ProcessModule;
  name: string;
  status: DeviceStatus;
  description: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  updateTime: string;
}

export interface ProductionStats {
  date: string;
  shift: ShiftType;
  feedingWeight: number;
  meltingOutput: number;
  castingOutput: number;
  rollingOutput: number;
  finishedWeight: number;
  passRate: number;
  runningHours: number;
}

export interface UserInfo {
  name: string;
  employeeId: string;
  position: string;
  department: string;
  phone: string;
  currentShift: ShiftType;
}

export interface TempPoint {
  time: string;
  value: number;
}

export interface ChartDataItem {
  label: string;
  value: number;
}
