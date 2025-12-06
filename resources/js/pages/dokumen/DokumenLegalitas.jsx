import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import Button from '../../components/button/Button';
import "./DokumenLegalitas.css";

const documents = [
  {
    id: 'surat-keterangan',
    title: 'Surat Keterangan',
    number: 'SK/2024/001',
    startDate: '1/1/2024',
    endDate: '31/12/2025',
    fileName: 'surat_keterangan.pdf',
    status: 'Aktif'
  },
  {
    id: 'str',
    title: 'STR (Surat Tanda Registrasi)',
    number: 'STR/2023/456',
    startDate: '1/1/2024',
    endDate: '31/12/2025',
    fileName: 'str_dokumen.pdf',
    status: 'Aktif'
  },
  {
    id: 'sip',
    title: 'SIP (Surat Izin Praktek)',
    number: 'SIP/2024/789',
    startDate: '1/1/2024',
    endDate: '31/12/2025',
    fileName: 'sip_dokumen.pdf',
    status: 'Aktif'
  }
];

const DokumenLegalitas = () => {
  return (
    <MainLayout>
      <div className="dokumen-legalitas">
        <div className="dokumen-header">
          <h1 className="dokumen-title">Dokumen Legalitas</h1>
          <p className="dokumen-subtitle">
            Kelola dokumen legalitas Anda: Surat Keterangan, STR, dan SIP.
          </p>
        </div>

        <div className="dokumen-list">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              variant="secondary"
              padding="spacious"
              shadow={false}
              title={doc.title}
              subtitle={`No: ${doc.number}`}
              headerAction={
                <Button
                  variant={doc.status === 'Aktif' ? 'success' : 'warning'}
                  size="small"
                  className={`status-btn ${doc.status === 'Aktif' ? 'status-aktif' : 'status-nonaktif'}`}
                  disabled
                >
                  {doc.status}
                </Button>
              }
              className="dokumen-card"
            >
              <div className="dokumen-card-grid">
                <div className="dokumen-info">
                  <div className="info-row">
                    <div className="info-block">
                      <span className="info-label">Tanggal Mulai</span>
                      <span className="info-value">{doc.startDate}</span>
                    </div>
                    <div className="info-block">
                      <span className="info-label">Berlaku Sampai</span>
                      <span className="info-value">{doc.endDate}</span>
                    </div>
                  </div>
                  <Button variant="primary" size="large" fullWidth>
                    Upload Baru
                  </Button>
                </div>

                <div className="dokumen-file">
                  <div className="info-block align-right">
                    <span className="info-label">File</span>
                    <a className="file-link" href="#">
                      {doc.fileName}
                    </a>
                  </div>
                  <Button variant="outline" size="large" fullWidth>
                    Lihat Detail
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </MainLayout>
  );
};

export default DokumenLegalitas;
