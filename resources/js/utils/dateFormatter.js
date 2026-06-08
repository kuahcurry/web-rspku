/**
 * Normalize an API date value to YYYY-MM-DD for use in <input type="date">.
 * Handles:
 * - plain dates "2004-06-17" -> "2004-06-17" (unchanged)
 * - ISO timestamps "2004-06-17T17:00:00.000000Z" -> local calendar day
 *   (e.g. Asia/Jakarta becomes "2004-06-18")
 */
export const toDateInput = (val) => {
  if (!val) return '';

  const str = String(val);

  // Keep plain date values exactly as-is to avoid timezone reinterpretation.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // For ISO/date-time values, convert to local calendar date safely.
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    // Fallback for unexpected values
    return str.split('T')[0];
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Format date to short Indonesian format: DD Mon YYYY
 * Example: 2004-10-18 => 18 Okt 2004
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return '-';

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
};
export const formatDateToIndonesian = (dateString) => {
  if (!dateString) return '-';
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original on error
  }
};
