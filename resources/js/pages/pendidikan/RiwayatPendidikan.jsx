import { useState, useRef } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import Tabs from '../../components/tabs/Tabs';
import { MdVisibility, MdAdd, MdCloudUpload, MdSave, MdDownload, MdDelete } from 'react-icons/md';
import styles from './RiwayatPendidikan.module.css';

const tabs = [
  { key: 'ijazah', label: 'Ijazah' },
  { key: 'pelatihan', label: 'Sertifikat Pelatihan' },
  { key: 'workshop', label: 'Sertifikat Workshop / In-House Training' }
];

const initialData = {
  ijazah: [
    { id: 1, title: 'S1 Keperawatan', institusi: 'Universitas Indonesia', tahun: '2020', file: 'ijazah_s1.pdf' },
    { id: 2, title: 'D3 Keperawatan', institusi: 'Politeknik Kesehatan Jakarta', tahun: '2017', file: 'ijazah_d3.pdf' }
  ],
  pelatihan: [{ id: 3, title: 'BTCLS', institusi: 'RS PKU Muhammadiyah', tahun: '2024', file: 'btcls.pdf' }],
  workshop: [
    {
      id: 4,
      title: 'Workshop Patient Safety',
      institusi: 'RS PKU Muhammadiyah',
      tahun: '2023',
      file: 'workshop_patient_safety.pdf'
    }
  ]
};

const RiwayatPendidikan = () => {
  const [activeTab, setActiveTab] = useState('ijazah');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dataByTab, setDataByTab] = useState(initialData);
  const [formData, setFormData] = useState({
    title: '',
    institusi: '',
    tahun: '',
    file: null
  });
  const fileInputRef = useRef(null);

  const items = dataByTab[activeTab] || [];

  const handleTabChange = (key) => {
    setActiveTab(key);
    setDeleteMode(false);
    setDeleteTargets([]);
    setShowDeleteModal(false);
  };

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleAddClick = () => {
    setFormData({ title: '', institusi: '', tahun: '', file: null });
    setShowAddModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    const idsToDelete = deleteTargets.map((entry) => entry.id);
    setDataByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((item) => !idsToDelete.includes(item.id))
    }));
    if (selectedItem && idsToDelete.includes(selectedItem.id)) {
      setSelectedItem(null);
      setShowViewModal(false);
    }
    setDeleteTargets([]);
    setDeleteMode(false);
    setShowDeleteModal(false);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.institusi || !formData.tahun || !formData.file) return;
    const newItem = {
      id: Date.now(),
      title: formData.title,
      institusi: formData.institusi,
      tahun: formData.tahun,
      file: formData.file?.name || 'lampiran_pendidikan.pdf'
    };
    setDataByTab((prev) => ({
      ...prev,
      [activeTab]: [newItem, ...(prev[activeTab] || [])]
    }));
    setShowAddModal(false);
    setFormData({ title: '', institusi: '', tahun: '', file: null });
  };

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Riwayat Pendidikan</h1>
        <p className={styles.pageSubtitle}>Kelola ijazah, sertifikat pelatihan, dan riwayat workshop</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />

          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>
              {activeTab === 'ijazah' && 'Daftar Ijazah'}
              {activeTab === 'pelatihan' && 'Daftar Sertifikat Pelatihan'}
              {activeTab === 'workshop' && 'Daftar Workshop / In-House Training'}
            </h3>
            <div className={styles.actionButtons}>
              <Button variant="success" size="small" icon={<MdAdd />} iconPosition="left" onClick={handleAddClick}>
                Tambah
              </Button>
              <Button variant="danger" size="small" onClick={handleDeleteButtonClick}>
                {deleteMode
                  ? deleteTargets.length
                    ? `Hapus (${deleteTargets.length})`
                    : 'Batal'
                  : 'Hapus'}
              </Button>
            </div>
          </div>

          {deleteMode && (
            <p className={styles.deleteNotice}>Pilih satu atau lebih data untuk dihapus, lalu klik Hapus.</p>
          )}

          <div className={styles.list}>
            {items.length === 0 && <p className={styles.emptyText}>Belum ada data.</p>}
            {items.map((item) => (
              <Card
                key={item.id}
                className={`${styles.itemCard} ${deleteMode ? styles.deleteSelectable : ''} ${
                  deleteTargets.some((entry) => entry.id === item.id) ? styles.deleteSelected : ''
                }`}
                shadow={false}
                onClick={() => handleSelectForDelete(item)}
              >
                <div className={styles.itemContent}>
                  <div>
                    <h4 className={styles.itemTitle}>{item.title}</h4>
                    <p className={styles.itemMeta}>{item.institusi}</p>
                    <p className={styles.itemMeta}>Tahun Lulus: {item.tahun}</p>
                  </div>
                  <div className={styles.fileBlock}>
                    <span className={styles.fileLabel}>File:</span>
                    <a
                      href="#"
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
                  </div>
                  <div className={styles.actions}>
                    <Button
                      variant="outline"
                      icon={<MdVisibility />}
                      iconPosition="left"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewClick(item);
                      }}
                    >
                      Lihat
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
        size="small"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <p className={styles.metaValue}>Hapus {deleteTargets.length} data terpilih?</p>
          <p className={styles.metaLabel}>Data yang dihapus tidak dapat dikembalikan.</p>
          {!!deleteTargets.length && (
            <ul className={styles.deleteList}>
              {deleteTargets.map((item) => (
                <li key={item.id} className={styles.deleteListItem}>
                  {item.title} - {item.institusi}
                </li>
              ))}
            </ul>
          )}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Batal
            </Button>
            <Button variant="danger" icon={<MdDelete />} iconPosition="left" onClick={handleConfirmDelete}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>

      {/* View PDF Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedItem?.title || 'Lihat Dokumen'}
        size="large"
        padding="normal"
      >
        <div className={styles.modalContent}>
          <div className={styles.metaRow}>
            <div>
              <p className={styles.metaLabel}>Institusi</p>
              <p className={styles.metaValue}>{selectedItem?.institusi || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>Tahun Lulus</p>
              <p className={styles.metaValue}>{selectedItem?.tahun || '-'}</p>
            </div>
            <div>
              <p className={styles.metaLabel}>File</p>
              <p className={styles.metaValue}>{selectedItem?.file || 'File belum tersedia'}</p>
            </div>
          </div>
          {selectedItem?.file && (
            <div className={styles.pdfFrameWrapper}>
              <iframe
                src={`/storage/${selectedItem.file}`}
                className={styles.pdfFrame}
                title="PDF Viewer"
              />
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
              onClick={() => window.open(`/storage/${selectedItem?.file}`, '_blank')}
              disabled={!selectedItem?.file}
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Form Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Tambah ${activeTab === 'ijazah' ? 'Ijazah' : activeTab === 'pelatihan' ? 'Sertifikat Pelatihan' : 'Workshop'}`}
        size="medium"
        padding="normal"
      >
        <Form onSubmit={handleAddSubmit} className={styles.modalContent}>
          <Input
            label="Judul/Nama"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Contoh: S1 Keperawatan"
            required
          />
          <Input
            label="Institusi"
            type="text"
            name="institusi"
            value={formData.institusi}
            onChange={handleInputChange}
            placeholder="Contoh: Universitas Indonesia"
            required
          />
          <Input
            label="Tahun Lulus"
            type="text"
            name="tahun"
            value={formData.tahun}
            onChange={handleInputChange}
            placeholder="Contoh: 2020"
            required
          />
          <div className={styles['upload-drop']}>
            <MdCloudUpload size={48} />
            <p>Pilih atau seret file ke sini</p>
            <span className={styles['upload-hint']}>PDF, maks 5MB</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <Button variant="outline" icon={<MdCloudUpload />} onClick={handleChooseFile}>
              Pilih File
            </Button>
            {formData.file && <div className={styles['upload-file-name']}>{formData.file.name}</div>}
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
              disabled={!formData.title || !formData.institusi || !formData.tahun || !formData.file}
            >
              Simpan Perubahan
            </Button>
          </Form.Actions>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default RiwayatPendidikan;
