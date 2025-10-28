export const USER_ROLES = ['admin', 'operator', 'user'] as const;
export type UserRole = typeof USER_ROLES[number];

export const REGIONS = [
  '北京',
  '天津',
  '上海',
  '重庆',
  '河北',
  '山西',
  '辽宁',
  '吉林',
  '黑龙江',
  '江苏',
  '浙江',
  '安徽',
  '福建',
  '江西',
  '山东',
  '河南',
  '湖北',
  '湖南',
  '广东',
  '广西',
  '海南',
  '四川',
  '贵州',
  '云南',
  '西藏',
  '陕西',
  '甘肃',
  '青海',
  '宁夏',
  '新疆',
  '内蒙古',
  '香港',
  '澳门',
  '台湾',
] as const;
export type Region = typeof REGIONS[number];

export const REGION_SLUG: Record<Region, string> = {
  北京: 'bei',
  天津: 'tj',
  上海: 'sh',
  重庆: 'cq',
  河北: 'heb',
  山西: 'shanxi',
  辽宁: 'ln',
  吉林: 'jl',
  黑龙江: 'hlj',
  江苏: 'js',
  浙江: 'zj',
  安徽: 'ah',
  福建: 'fj',
  江西: 'jx',
  山东: 'sd',
  河南: 'henan',
  湖北: 'hubei',
  湖南: 'hunan',
  广东: 'gd',
  广西: 'gx',
  海南: 'hn',
  四川: 'sc',
  贵州: 'gz',
  云南: 'yn',
  西藏: 'xz',
  陕西: 'sx',
  甘肃: 'gs',
  青海: 'qh',
  宁夏: 'nx',
  新疆: 'xj',
  内蒙古: 'nmg',
  香港: 'hk',
  澳门: 'mo',
  台湾: 'tw',
};

export const REGION_LABELS: Record<Region, string> = REGIONS.reduce((acc, region) => {
  acc[region] = region;
  return acc;
}, {} as Record<Region, string>);

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  operator: '运营专员',
  user: '业务成员',
};

export const DEFAULT_ROLE: UserRole = 'user';
export const DEFAULT_REGION: Region = REGIONS[0];
