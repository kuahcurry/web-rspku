import { useState, useRef } from 'react';
import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import Modal from '../../components/modal/Modal';
import Form from '../../components/form/Form';
import Input from '../../components/input/Input';
import Tabs from '../../components/tabs/Tabs';
import { MdVisibility, MdAdd, MdCloudUpload, MdSave, MdDownload } from 'react-icons/md';
import styles from './RiwayatPendidikan.module.css';

const tabs = [
  { key: 'ijazah', label: 'Ijazah' },
  { key: 'pelatihan', label: 'Sertifikat Pelatihan' },
  { key: 'workshop', label: 'Sertifikat Workshop / In-House Training' }
];

const ijazahList = [
  { id: 1, title: 'S1 Keperawatan', institusi: 'Universitas Indonesia', tahun: '2020', file: 'ijazah_s1.pdf' },
  { id: 2, title: 'D3 Keperawatan', institusi: 'Politeknik Kesehatan Jakarta', tahun: '2017', file: 'ijazah_d3.pdf' }
];

const pelatihanList = [
  { id: 3, title: 'BTCLS', institusi: 'RS PKU Muhammadiyah', tahun: '2024', file: 'btcls.pdf' }
];

const workshopList = [
  { id: 4, title: 'Workshop Patient Safety', institusi: 'RS PKU Muhammadiyah', tahun: '2023', file: 'workshop_patient_safety.pdf' }
];

const listByTab = {
  ijazah: ijazahList,
  pelatihan: pelatihanList,
  workshop: workshopList
};

const RiwayatPendidikan = () => {
  const [activeTab, setActiveTab] = useState('ijazah');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    institusi: '',
    tahun: '',
    file: null
  });
  const fileInputRef = useRef(null);

  const items = listByTab[activeTab] || [];

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

  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Riwayat Pendidikan</h1>
        <p className={styles.pageSubtitle}>Kelola ijazah, sertifikat pelatihan, dan riwayat workshop</p>
      </header>

      <div className={styles.container}>
        <div className={styles.cardShell}>
          <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

          <div className={styles.headerRow}>
            <h3 className={styles.sectionTitle}>
              {activeTab === 'ijazah' && 'Daftar Ijazah'}
              {activeTab === 'pelatihan' && 'Daftar Sertifikat Pelatihan'}
              {activeTab === 'workshop' && 'Daftar Workshop / In-House Training'}
            </h3>
            <Button variant="success" size="small" icon={<MdAdd />} iconPosition="left" onClick={handleAddClick}>
              Tambah
            </Button>
          </div>

          <div className={styles.list}>
            {items.length === 0 && <p className={styles.emptyText}>Belum ada data.</p>}
            {items.map((item) => (
              <Card key={item.id} className={styles.itemCard} shadow={false}>
                <div className={styles.itemContent}>
                  <div>
                    <h4 className={styles.itemTitle}>{item.title}</h4>
                    <p className={styles.itemMeta}>{item.institusi}</p>
                    <p className={styles.itemMeta}>Tahun Lulus: {item.tahun}</p>
                  </div>
                  <div className={styles.fileBlock}>
                    <span className={styles.fileLabel}>File:</span>
                    <a href="#" className={styles.fileLink}>
                      {item.file}
                    </a>
                  </div>
                  <div className={styles.actions}>
                    <Button variant="outline" icon={<MdVisibility />} iconPosition="left" size="small" onClick={() => handleViewClick(item)}>
                      Lihat
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* View PDF Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedItem?.title || 'Lihat Dokumen'}
        size="large"
        padding="normal"
      >
        <div className={styles['modal-content']}>
          <div className={styles['doc-info-header']}>
            <div>
              <p className={styles['doc-name']}>{selectedItem?.file || 'File belum tersedia'}</p>
              <p className={styles['doc-meta']}>{selectedItem?.institusi}</p>
              <p className={styles['doc-meta']}>Tahun Lulus: {selectedItem?.tahun}</p>
            </div>
          </div>
          {selectedItem?.file && (
            <div className={styles['pdf-viewer']}>
              <iframe
                src={`/storage/${selectedItem.file}`}
                className={styles['pdf-frame']}
                title="PDF Viewer"
              />
            </div>
          )}
        </div>
        <div className={styles['modal-actions']}>
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
      </Modal>

      {/* Add Form Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Tambah ${activeTab === 'ijazah' ? 'Ijazah' : activeTab === 'pelatihan' ? 'Sertifikat Pelatihan' : 'Workshop'}`}
        size="medium"
        padding="normal"
      >
        <Form onSubmit={(e) => e.preventDefault()} className={styles['modal-content']}>
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
          <Form.Actions align="right" className={styles['modal-actions']}>
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
