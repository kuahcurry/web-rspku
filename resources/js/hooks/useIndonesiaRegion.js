import { useState, useEffect } from 'react';
import {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages
} from '../services/indonesiaRegion';

export const useIndonesiaRegion = () => {
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch semua provinsi saat component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const data = await getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegencies = async (provinceId) => {
    if (!provinceId) {
      setRegencies([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getRegencies(provinceId);
      setRegencies(data);
      // Reset district dan village saat provinsi berubah
      setDistricts([]);
      setVillages([]);
    } catch (error) {
      console.error('Error fetching regencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (regencyId) => {
    if (!regencyId) {
      setDistricts([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getDistricts(regencyId);
      setDistricts(data);
      // Reset village saat kabupaten/kota berubah
      setVillages([]);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVillages = async (districtId) => {
    if (!districtId) {
      setVillages([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getVillages(districtId);
      setVillages(data);
    } catch (error) {
      console.error('Error fetching villages:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    provinces,
    regencies,
    districts,
    villages,
    loading,
    fetchRegencies,
    fetchDistricts,
    fetchVillages
  };
};
