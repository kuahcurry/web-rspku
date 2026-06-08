// Helper untuk menangani perubahan berjenjang pada field wilayah Indonesia.
// Mengembalikan state form baru berdasarkan input yang berubah.
export const buildRegionStateUpdate = ({
  name,
  value,
  state,
  provinces = [],
  regencies = [],
  districts = [],
  villages = []
}) => {
  const nextState = { ...state, [name]: value };

  if (name === 'provinsiId') {
    const selectedProvince = provinces.find((p) => p.value === value);
    return {
      ...nextState,
      provinsi: selectedProvince?.label || '',
      kabupatenId: '',
      kabupaten: '',
      kecamatanId: '',
      kecamatan: '',
      kelurahanId: '',
      kelurahan: ''
    };
  }

  if (name === 'kabupatenId') {
    const selectedRegency = regencies.find((r) => r.value === value);
    return {
      ...nextState,
      kabupaten: selectedRegency?.label || '',
      kecamatanId: '',
      kecamatan: '',
      kelurahanId: '',
      kelurahan: ''
    };
  }

  if (name === 'kecamatanId') {
    const selectedDistrict = districts.find((d) => d.value === value);
    return {
      ...nextState,
      kecamatan: selectedDistrict?.label || '',
      kelurahanId: '',
      kelurahan: ''
    };
  }

  if (name === 'kelurahanId') {
    const selectedVillage = villages.find((v) => v.value === value);
    return {
      ...nextState,
      kelurahan: selectedVillage?.label || ''
    };
  }

  return nextState;
};
