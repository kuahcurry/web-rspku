import MainLayout from '../../layout/main/MainLayout';
import Card from '../../components/card/Card';
import styles from './alat.module.css';

function CetakPdf() {
  return (
    <MainLayout>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Cetak PDF</h1>
        <p className={styles.pageSubtitle}>Halaman ini sedang dalam pengembangan.</p>
      </header>

      <Card className={styles.cardShell}>
        <p className={styles.placeholderText}>
          Fitur pengaturan dan pencetakan PDF akan hadir di sini. Nantikan update selanjutnya.
        </p>
      </Card>
    </MainLayout>
  );
}

export default CetakPdf;
