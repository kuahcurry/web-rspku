import { useState } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import { MdAdd, MdVisibility, MdCloudUpload, MdSave, MdDownload, MdDelete } from 'react-icons/md';
import styles from './Penugasan.module.css';

const initialAssignments = [
  {
    id: 1,
    unit: 'IGD (Instalasi Gawat Darurat)',
    startDate: '2025-01-01',
    endDate: '',
    penanggungJawab: 'Dr. Ahmad Fauzi, Sp.EM',
    file: 'penugasan_igd_2025.pdf',
    fileUrl: '/storage/penugasan_igd_2025.pdf'
  },
  {
    id: 2,
    unit: 'Rawat Inap Lantai 3',
    startDate: '2024-07-01',
    endDate: '2024-12-31',
    penanggungJawab: 'Ns. Siti Aminah, M.Kep',
    file: 'penugasan_ri3_2024.pdf',
    fileUrl: '/storage/penugasan_ri3_2024.pdf'
  },
  {
    id: 3,
    unit: 'Poliklinik Umum',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    penanggungJawab: 'Dr. Budi Santoso, Sp.PD',
    file: 'penugasan_poli_2024.pdf',
    fileUrl: '/storage/penugasan_poli_2024.pdf'
  }
];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const deriveStatus = (endDate) => {
  if (!endDate) return 'Aktif';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 'Aktif';
  end.setHours(0, 0, 0, 0);
  return end >= today ? 'Aktif' : 'Selesai';
};

const getStatusVariant = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'aktif') return 'success';
  return 'secondary';
};

const Penugasan = () => {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [formData, setFormData] = useState({
    unit: '',
    penanggungJawab: '',
    startDate: '',
    endDate: '',
    file: null,
    fileUrl: null
  });

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleAddClick = () => {
    setFormData({
      unit: '',
      penanggungJawab: '',
      startDate: '',
      endDate: '',
      file: null,
      fileUrl: null
    });
    setShowAddModal(true);
  };

  const handleStartDelete = () => {
    setDeleteMode(true);
    setDeleteTargets([]);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setDeleteMode(false);
    setDeleteTargets([]);
    setShowDeleteModal(false);
  };

  const handleSelectForDelete = (item) => {
    if (!deleteMode) return;
    setDeleteTargets((prev) => {
      const exists = prev.find((entry) => entry.id === item.id);
      if (exists) {
        return prev.filter((entry) => entry.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTargets.length) return;
    const idsToDelete = deleteTargets.map((item) => item.id);
    setAssignments((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
    if (selectedItem && idsToDelete.includes(selectedItem.id)) {
      setSelectedItem(null);
      setShowViewModal(false);
    }
    setShowDeleteModal(false);
    setDeleteTargets([]);
    setDeleteMode(false);
  };

  const handleDeleteButtonClick = () => {
    if (!deleteMode) {
      handleStartDelete();
      return;
    }
    if (deleteTargets.length) {
      setShowDeleteModal(true);
      return;
    }
    handleCancelDelete();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    const fileUrl = file ? URL.createObjectURL(file) : null;
    setFormData({ ...formData, file, fileUrl });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newItem = {
      id: Date.now(),
      unit: formData.unit,
      penanggungJawab: formData.penanggungJawab,
      startDate: formData.startDate,
      endDate: formData.endDate,
      file: formData.file?.name || 'lampiran_penugasan.pdf',
      fileUrl: formData.fileUrl
    };

    setAssignments([newItem, ...assignments]);
    setShowAddModal(false);
  };

  const isFormValid =
    formData.unit &&
    formData.penanggungJawab &&
    formData.startDate &&
    formData.endDate &&
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
            </div>
            <div className={styles.actionButtons}>
              <Button
                variant="success"
                icon={<MdAdd />}
                iconPosition="left"
                onClick={handleAddClick}
                className={`${styles.compactButton} ${styles.headerAction}`}
              >
                Tambah
              </Button>
              <Button
                variant="danger"
                icon={<MdDelete />}
                iconPosition="left"
                onClick={handleDeleteButtonClick}
                className={`${styles.compactButton} ${styles.headerAction}`}
              >
                {deleteMode
                  ? deleteTargets.length
                    ? `Hapus (${deleteTargets.length})`
                    : 'Batal'
                  : 'Hapus'}
              </Button>
            </div>
          </div>

          {deleteMode && (
            <p className={styles.deleteNotice}>
              Pilih satu atau lebih kartu penugasan yang ingin dihapus, lalu klik Hapus.
            </p>
          )}

          <div className={styles.list}>
            {assignments.map((item) => (
              <Card
                key={item.id}
                className={`${styles.itemCard} ${deleteMode ? styles.deleteSelectable : ''} ${
                  deleteTargets.some((entry) => entry.id === item.id) ? styles.deleteSelected : ''
                }`}
                shadow={false}
                onClick={() => handleSelectForDelete(item)}
              >
                <div className={styles.itemBody}>
                  <div className={styles.itemHead}>
                    <h4 className={styles.itemTitle}>{item.unit}</h4>
                    <Button
                      variant={getStatusVariant(deriveStatus(item.endDate))}
                      size="small"
                      disabled
                      className={styles.compactButton}
                    >
                      {deriveStatus(item.endDate)}
                    </Button>
                  </div>

                  <div className={styles.itemGrid}>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>Periode</p>
                      <p className={styles.metaValue}>
                        {formatDate(item.startDate)} - {item.endDate ? formatDate(item.endDate) : 'Sekarang'}
                      </p>
                    </div>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>Penanggung Jawab</p>
                      <p className={styles.metaValue}>{item.penanggungJawab}</p>
                    </div>
                    <div className={styles.metaBlock}>
                      <p className={styles.metaLabel}>File</p>
                      <div className={styles.fileAction}>
                        <a
                          href={item.fileUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.fileLink}
                          onClick={(e) => {
                            if (deleteMode) {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectForDelete(item);
                            }
                          }}
                        >
                          {item.file}
                        </a>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<MdVisibility />}
                          iconPosition="left"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewClick(item);
                          }}
                          className={`${styles.compactButton} ${styles.viewButton}`}
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
              <p className={styles.metaValue}>
                {formatDate(selectedItem?.startDate)} -{' '}
                {selectedItem?.endDate ? formatDate(selectedItem?.endDate) : 'Sekarang'}
              </p>
            </div>
            <div>
              <p className={styles.metaLabel}>Penanggung Jawab</p>
              <p className={styles.metaValue}>{selectedItem?.penanggungJawab || '-'}</p>
            </div>
          </div>
          {selectedItem?.fileUrl && (
            <div className={styles.pdfFrameWrapper}>
              <iframe title="Preview PDF" src={selectedItem.fileUrl} className={styles.pdfFrame} />
            </div>
          )}
          <div className={styles.modalActions}>
            <Button variant="danger" onClick={() => setShowViewModal(false)}>
              Tutup
            </Button>
            <Button
              variant="primary"
              icon={<MdDownload />}
              iconPosition="left"
              onClick={() => {
                const downloadUrl =
                  selectedItem?.fileUrl || (selectedItem?.file ? `/storage/${selectedItem.file}` : null);
                if (downloadUrl) {
                  window.open(downloadUrl, '_blank');
                }
              }}
              disabled={!selectedItem?.fileUrl && !selectedItem?.file}
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
        size="small"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <p className={styles.metaValue}>
            Hapus {deleteTargets.length} penugasan terpilih?
          </p>
          <p className={styles.metaLabel}>
            Tindakan ini akan menghapus penugasan dari daftar riwayat.
          </p>
          {!!deleteTargets.length && (
            <ul className={styles.deleteList}>
              {deleteTargets.map((item) => (
                <li key={item.id} className={styles.deleteListItem}>
                  {item.unit}
                </li>
              ))}
            </ul>
          )}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Batal
            </Button>
            <Button
              variant="danger"
              icon={<MdDelete />}
              iconPosition="left"
              onClick={handleConfirmDelete}
            >
              Hapus
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
              name="startDate"
              type="date"
              placeholder="Pilih tanggal mulai"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Periode Selesai"
              name="endDate"
              type="date"
              placeholder="Pilih tanggal selesai"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </Form.Row>

          <div className={styles.fileDrop} onClick={() => document.getElementById('penugasanFile').click()}>
            <MdCloudUpload size={40} />
            <div className={styles.fileDropText}>
              <p className={styles.fileDropTitle}>Pilih atau seret file ke sini</p>
              <p className={styles.fileDropHint}>PDF, maks 5MB</p>
              <Button
                type="button"
                variant="outline"
                size="medium"
                icon={<MdCloudUpload />}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('penugasanFile').click();
                }}
                className={styles.fileDropButton}
              >
                Pilih File
              </Button>
              {formData.file && <p className={styles.fileDropSelected}>{formData.file.name}</p>}
            </div>
            <input
              id="penugasanFile"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              required
            />
          </div>

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
