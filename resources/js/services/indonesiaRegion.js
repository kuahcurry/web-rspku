const API_BASE_URL = '/api/regions';

const capitalizeWords = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toArrayData = (json) => (Array.isArray(json?.data) ? json.data : []);

const encodeParam = (value) => encodeURIComponent(String(value));

const mapOption = (item) => {
  const label = capitalizeWords(item.name);
  return {
    value: item.code,
    label
  };
};

export const getProvinces = async () => {
  const response = await fetch(`${API_BASE_URL}/provinces`);
  if (!response.ok) throw new Error('Failed to fetch provinces');
  const json = await response.json();
  return toArrayData(json).map(mapOption);
};

export const getRegenciesByProvinceCode = async (provinceCode) => {
  if (!provinceCode) return [];
  const response = await fetch(`${API_BASE_URL}/regencies/${encodeParam(provinceCode)}`);
  if (!response.ok) throw new Error('Failed to fetch regencies');
  const json = await response.json();
  return toArrayData(json).map(mapOption);
};

export const getDistrictsByRegencyCode = async (regencyCode) => {
  if (!regencyCode) return [];
  const response = await fetch(`${API_BASE_URL}/districts/${encodeParam(regencyCode)}`);
  if (!response.ok) throw new Error('Failed to fetch districts');
  const json = await response.json();
  return toArrayData(json).map(mapOption);
};

export const getVillagesByDistrictCode = async (districtCode) => {
  if (!districtCode) return [];
  const response = await fetch(`${API_BASE_URL}/villages/${encodeParam(districtCode)}`);
  if (!response.ok) throw new Error('Failed to fetch villages');
  const json = await response.json();
  return toArrayData(json).map(mapOption);
};

// Get province name by code
export const getProvinceNameByCode = async (provinceCode) => {
  if (!provinceCode) return null;
  try {
    const provinces = await getProvinces();
    const province = provinces.find((p) => p.value === provinceCode);
    return province ? province.label : null;
  } catch (error) {
    console.error('Error fetching province:', error);
    return null;
  }
};

// Get regency name by code
export const getRegencyNameByCode = async (provinceCode, regencyCode) => {
  if (!provinceCode || !regencyCode) return null;
  try {
    const regencies = await getRegenciesByProvinceCode(provinceCode);
    const regency = regencies.find((r) => r.value === regencyCode);
    return regency ? regency.label : null;
  } catch (error) {
    console.error('Error fetching regency:', error);
    return null;
  }
};

// Get district name by code
export const getDistrictNameByCode = async (regencyCode, districtCode) => {
  if (!regencyCode || !districtCode) return null;
  try {
    const districts = await getDistrictsByRegencyCode(regencyCode);
    const district = districts.find((d) => d.value === districtCode);
    return district ? district.label : null;
  } catch (error) {
    console.error('Error fetching district:', error);
    return null;
  }
};

// Get village name by code
export const getVillageNameByCode = async (districtCode, villageCode) => {
  if (!districtCode || !villageCode) return null;
  try {
    const villages = await getVillagesByDistrictCode(districtCode);
    const village = villages.find((v) => v.value === villageCode);
    return village ? village.label : null;
  } catch (error) {
    console.error('Error fetching village:', error);
    return null;
  }
};

// Backward-compatible aliases for existing imports/callers
export const getRegencies = getRegenciesByProvinceCode;
export const getDistricts = getDistrictsByRegencyCode;
export const getVillages = getVillagesByDistrictCode;
export const getProvinceNameById = getProvinceNameByCode;
export const getRegencyNameById = getRegencyNameByCode;
export const getDistrictNameById = getDistrictNameByCode;
export const getVillageNameById = getVillageNameByCode;
