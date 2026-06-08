import { useState } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import { MdAdd, MdVisibility, MdCloudUpload, MdSave, MdDownload } from 'react-icons/md';
import styles from './Penugasan.module.css';

const initialAssignments = [
  {
    id: 1,
    unit: 'IGD (Instalasi Gawat Darurat)',
    periode: 'Jan 2025 - Sekarang',
    penanggungJawab: 'Dr. Ahmad Fauzi, Sp.EM',
    status: 'Aktif',
    file: 'penugasan_igd_2025.pdf'
  },
  {
    id: 2,
    unit: 'Rawat Inap Lantai 3',
    periode: 'Jul 2024 - Des 2024',
    penanggungJawab: 'Ns. Siti Aminah, M.Kep',
    status: 'Selesai',
    file: 'penugasan_ri3_2024.pdf'
  },
  {
    id: 3,
    unit: 'Poliklinik Umum',
    periode: 'Jan 2024 - Jun 2024',
    penanggungJawab: 'Dr. Budi Santoso, Sp.PD',
    status: 'Selesai',
    file: 'penugasan_poli_2024.pdf'
  }
];

const getStatusClass = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return styles.statusAktif;
  if (normalized === 'selesai') return styles.statusSelesai;
  return '';
};

const Penugasan = () => {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    unit: '',
    penanggungJawab: '',
    periodeMulai: '',
    periodeSelesai: '',
    status: 'Aktif',
    file: null
  });

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleAddClick = () => {
    setFormData({
      unit: '',
      penanggungJawab: '',
      periodeMulai: '',
      periodeSelesai: '',
      status: 'Aktif',
      file: null
    });
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFormData({ ...formData, file });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newItem = {
      id: Date.now(),
      unit: formData.unit,
      periode: `${formData.periodeMulai} - ${formData.periodeSelesai || 'Sekarang'}`,
      penanggungJawab: formData.penanggungJawab,
      status: formData.status,
      file: formData.file?.name || 'lampiran_penugasan.pdf'
    };

    setAssignments([newItem, ...assignments]);
    setShowAddModal(false);
  };

  const isFormValid =
    formData.unit &&
    formData.penanggungJawab &&
    formData.periodeMulai &&
    formData.periodeSelesai &&
    formData.status &&
    formData.file;

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Penugasan</h1>
        <p className={styles.pageSubtitle}>Riwayat penugasan dan penempatan unit kerja</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.sectionTitle}>Riwayat Penugasan</h3>
              <p className={styles.sectionSubtitle}>Pantau status penugasan beserta penanggung jawab dan lampiran</p>
            </div>
            <Button variant="primary" size="small" icon={<MdAdd />} iconPosition="left" onClick={handleAddClick}>
              Tambah
            </Button>
          </div>

          <div className={styles.list}>
            {assignments.map((item) => (
              <Card key={item.id} className={styles.itemCard} shadow={false}>
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <h4 className={styles.itemTitle}>{item.unit}</h4>
                    <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>{item.status}</span>
                  </div>

                  <div className={styles.itemGrid}>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>Periode</p>
                      <p className={styles.metaValue}>{item.periode}</p>
                    </div>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>Penanggung Jawab</p>
                      <p className={styles.metaValue}>{item.penanggungJawab}</p>
                    </div>
                    <div className={styles.fileBlock}>
                      <p className={styles.metaLabel}>File</p>
                      <div className={styles.fileAction}>
                        <a href="#" className={styles.fileLink}>
                          {item.file}
                        </a>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<MdVisibility />}
                          iconPosition="left"
                          onClick={() => handleViewClick(item)}
                        >
                          Lihat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedItem?.unit || 'Detail Penugasan'}
        size="large"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <div className={styles.metaRow}>
            <div>
              <p className={styles.metaLabel}>Periode</p>
              <p className={styles.metaValue}>{selectedItem?.periode || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Penanggung Jawab</p>
              <p className={styles.metaValue}>{selectedItem?.penanggungJawab || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Status</p>
              <p className={`${styles.metaValue} ${styles.metaStatus}`}>
                <span className={`${styles.statusBadge} ${getStatusClass(selectedItem?.status)}`}>
                  {selectedItem?.status || '-'}
                </span>
              </p>
            </div>
          </div>
          <div className={styles.filePreview}>
            <div className={styles.fileInfo}>
              <MdCloudUpload size={32} />
              <div>
                <p className={styles.metaLabel}>Lampiran</p>
                <p className={styles.metaValue}>{selectedItem?.file || 'Belum ada file'}</p>
              </div>
            </div>
            <Button
              variant="primary"
              icon={<MdDownload />}
              iconPosition="left"
              disabled={!selectedItem?.file}
              onClick={() => selectedItem?.file && window.open(`/storage/${selectedItem.file}`, '_blank')}
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Penugasan"
        size="medium"
        padding="normal"
      >
        <Form onSubmit={handleSubmit} className={styles.modalForm}>
          <Form.Row columns={2} className={styles.formRow}>
            <Input
              label="Unit / Bagian"
              name="unit"
              placeholder="Contoh: IGD (Instalasi Gawat Darurat)"
              value={formData.unit}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Penanggung Jawab"
              name="penanggungJawab"
              placeholder="Contoh: Dr. Ahmad Fauzi, Sp.EM"
              value={formData.penanggungJawab}
              onChange={handleInputChange}
              required
            />
          </Form.Row>

          <Form.Row columns={2} className={styles.formRow}>
            <Input
              label="Periode Mulai"
              name="periodeMulai"
              placeholder="Contoh: Jan 2025"
              value={formData.periodeMulai}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Periode Selesai"
              name="periodeSelesai"
              placeholder="Contoh: Sekarang / Des 2025"
              value={formData.periodeSelesai}
              onChange={handleInputChange}
              required
            />
          </Form.Row>

          <Form.Row columns={2} className={styles.formRow}>
            <Input
              label="Status Penugasan"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'Aktif', label: 'Aktif' },
                { value: 'Selesai', label: 'Selesai' }
              ]}
              placeholder="Pilih status"
              required
            />
            <Input
              label="Lampiran (PDF)"
              name="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              helperText={formData.file ? formData.file.name : 'Unggah file penugasan (PDF, maks 5MB)'}
              required
            />
          </Form.Row>

          <Form.Actions align="right" className={styles.modalActions}>
            <Button variant="danger" type="button" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button
              variant="success"
              icon={<MdSave />}
              iconPosition="left"
              type="submit"
              disabled={!isFormValid}
            >
              Simpan Penugasan
            </Button>
          </Form.Actions>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default Penugasan;
