const capitalizeWords = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatIdWithDots = (id) => {
  if (!id) return id;
  const str = id.toString().replace(/\./g, '');
  if (str.length === 4) {
    // Regency: 3402 -> 34.02
    return `${str.slice(0, 2)}.${str.slice(2)}`;
  }
  if (str.length === 6) {
    // District: 340206 -> 34.02.06
    return `${str.slice(0, 2)}.${str.slice(2, 4)}.${str.slice(4)}`;
  }
  if (str.length === 10) {
    // Village: 3402062001 -> 34.02.06.2001
    return `${str.slice(0, 2)}.${str.slice(2, 4)}.${str.slice(4, 6)}.${str.slice(6)}`;
  }
  return str;
};

const mapOption = (item) => {
  const label = capitalizeWords(item.nama || item.name);
  return {
    value: formatIdWithDots(item.id),
    label
  };
};

export const getProvinces = async () => {
  const response = await fetch(`https://ibnux.github.io/data-indonesia/provinsi.json`);
  if (!response.ok) throw new Error('Failed to fetch provinces');
  const data = await response.json();
  return data.map(mapOption);
};

export const getRegencies = async (provinceId) => {
  if (!provinceId) return [];
  const cleanId = provinceId.toString().replace(/\./g, '');
  const response = await fetch(`https://ibnux.github.io/data-indonesia/kabupaten/${cleanId}.json`);
  if (!response.ok) throw new Error('Failed to fetch regencies');
  const data = await response.json();
  return data.map(mapOption);
};

export const getDistricts = async (regencyId) => {
  if (!regencyId) return [];
  const cleanId = regencyId.toString().replace(/\./g, '');
  const response = await fetch(`https://ibnux.github.io/data-indonesia/kecamatan/${cleanId}.json`);
  if (!response.ok) throw new Error('Failed to fetch districts');
  const data = await response.json();
  return data.map(mapOption);
};

export const getVillages = async (districtId) => {
  if (!districtId) return [];
  const cleanId = districtId.toString().replace(/\./g, '');
  const response = await fetch(`https://ibnux.github.io/data-indonesia/kelurahan/${cleanId}.json`);
  if (!response.ok) throw new Error('Failed to fetch villages');
  const data = await response.json();
  return data.map(mapOption);
};

// Get province name by ID
export const getProvinceNameById = async (provinceId) => {
  if (!provinceId) return null;
  try {
    const provinces = await getProvinces();
    const province = provinces.find(p => p.value === provinceId);
    return province ? province.label : null;
  } catch (error) {
    console.error('Error fetching province:', error);
    return null;
  }
};

// Get regency name by ID
export const getRegencyNameById = async (provinceId, regencyId) => {
  if (!provinceId || !regencyId) return null;
  try {
    const regencies = await getRegencies(provinceId);
    const regency = regencies.find(r => r.value === regencyId);
    return regency ? regency.label : null;
  } catch (error) {
    console.error('Error fetching regency:', error);
    return null;
  }
};

// Get district name by ID
export const getDistrictNameById = async (regencyId, districtId) => {
  if (!regencyId || !districtId) return null;
  try {
    const districts = await getDistricts(regencyId);
    const district = districts.find(d => d.value === districtId);
    return district ? district.label : null;
  } catch (error) {
    console.error('Error fetching district:', error);
    return null;
  }
};

// Get village name by ID
export const getVillageNameById = async (districtId, villageId) => {
  if (!districtId || !villageId) return null;
  try {
    const villages = await getVillages(districtId);
    const village = villages.find(v => v.value === villageId);
    return village ? village.label : null;
  } catch (error) {
    console.error('Error fetching village:', error);
    return null;
  }
};
