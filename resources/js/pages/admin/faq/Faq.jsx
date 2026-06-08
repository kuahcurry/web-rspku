import { useState } from 'react';
import AdminLayout from '../../../layout/admin/AdminLayout';
import Card from '../../../components/card/Card';
import SafeMarkdown from '../../../components/SafeMarkdown';
import { 
  MdHelp,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdDashboard,
  MdPeople,
  MdGavel,
  MdSettings,
  MdSearch,
  MdPictureAsPdf
} from 'react-icons/md';
import styles from './Faq.module.css';

const Faq = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('semua');
  const [expandedItems, setExpandedItems] = useState({});

  const categories = [
    { id: 'semua', label: 'Semua', icon: MdHelp },
    { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
    { id: 'pengguna', label: 'Manajemen Pengguna', icon: MdPeople },
    { id: 'etik', label: 'Etik & Disiplin', icon: MdGavel },
    { id: 'alat', label: 'Alat PDF', icon: MdPictureAsPdf },
    { id: 'pengaturan', label: 'Pengaturan', icon: MdSettings },
  ];

  const faqData = [
    // Dashboard
    {
      id: 1,
      category: 'dashboard',
      question: 'Bagaimana cara membaca statistik di Dashboard?',
      answer: `Dashboard menampilkan 4 statistik utama:
      
1. **Total Pengguna**: Jumlah seluruh pengguna yang terdaftar dalam sistem
2. **Pengguna Aktif**: Jumlah pengguna yang sudah melengkapi profil dan dokumen
3. **Kasus Etik/Disiplin**: Jumlah kasus etik dan disiplin yang perlu ditinjau
4. **Dokumen Segera Habis**: Jumlah dokumen yang akan kedaluwarsa dalam 90 hari ke depan

Klik pada setiap kartu statistik untuk melihat detail lebih lanjut.`
    },
    {
      id: 2,
      category: 'dashboard',
      question: 'Apa arti warna pada dokumen yang segera kedaluwarsa?',
      answer: `Warna menunjukkan tingkat urgensi:
      
- **Merah**: Dokumen akan kedaluwarsa dalam 30 hari atau kurang
- **Kuning/Orange**: Dokumen akan kedaluwarsa dalam 31-60 hari
- **Hijau**: Dokumen akan kedaluwarsa dalam 61-90 hari

Prioritaskan untuk mengingatkan pengguna dengan dokumen berwarna merah terlebih dahulu.`
    },
    {
      id: 3,
      category: 'dashboard',
      question: 'Bagaimana cara melihat aktivitas terbaru pengguna?',
      answer: `Pada bagian bawah Dashboard terdapat daftar "Aktivitas Terbaru" yang menampilkan:

- Pendaftaran pengguna baru
- Pembaruan dokumen
- Verifikasi email
- Pengunggahan dokumen

Daftar ini diperbarui secara otomatis setiap 30 detik. Anda juga dapat mengklik tombol refresh untuk memperbarui data secara manual.`
    },

    // Manajemen Pengguna
    {
      id: 4,
      category: 'pengguna',
      question: 'Bagaimana cara mencari pengguna tertentu?',
      answer: `Untuk mencari pengguna:

1. Buka halaman **Manajemen Pengguna** dari menu sidebar
2. Gunakan **kolom pencarian** di bagian atas tabel
3. Ketik nama, NIP, atau email pengguna yang dicari
4. Hasil pencarian akan muncul secara otomatis

Anda juga dapat menggunakan filter untuk menyaring berdasarkan status verifikasi atau role pengguna.`
    },
    {
      id: 5,
      category: 'pengguna',
      question: 'Bagaimana cara melihat detail profil pengguna?',
      answer: `Untuk melihat detail profil pengguna:

1. Buka halaman **Manajemen Pengguna**
2. Cari pengguna yang ingin dilihat
3. Klik tombol **Lihat Detail** atau ikon mata pada baris pengguna
4. Halaman detail akan menampilkan:
   - Informasi pribadi
   - Dokumen yang diunggah
   - Riwayat pendidikan
   - Status kredensial
   - Riwayat etik & disiplin`
    },
    {
      id: 6,
      category: 'pengguna',
      question: 'Bagaimana cara mengubah role pengguna?',
      answer: `Untuk mengubah role pengguna:

1. Buka halaman **Manajemen Pengguna**
2. Klik **Lihat Detail** pada pengguna yang ingin diubah
3. Pada halaman detail, cari bagian **Role Pengguna**
4. Pilih role baru dari dropdown yang tersedia
5. Klik **Simpan Perubahan**

**Catatan**: Perubahan role akan berlaku segera setelah pengguna login kembali.`
    },
    {
      id: 7,
      category: 'pengguna',
      question: 'Bagaimana cara menonaktifkan akun pengguna?',
      answer: `Untuk menonaktifkan akun pengguna:

1. Buka halaman **Manajemen Pengguna**
2. Klik **Lihat Detail** pada pengguna yang ingin dinonaktifkan
3. Scroll ke bagian bawah halaman
4. Klik tombol **Nonaktifkan Akun**
5. Konfirmasi tindakan pada dialog yang muncul

Pengguna yang dinonaktifkan tidak akan dapat login ke sistem hingga akun diaktifkan kembali.`
    },

    // Etik & Disiplin
    {
      id: 8,
      category: 'etik',
      question: 'Bagaimana cara melihat daftar kasus etik & disiplin?',
      answer: `Untuk melihat daftar kasus:

1. Klik menu **Etik & Disiplin** di sidebar
2. Halaman akan menampilkan tabel semua kasus yang tercatat
3. Gunakan tab untuk memfilter berdasarkan jenis (Etik/Disiplin)
4. Gunakan filter status untuk melihat kasus aktif, selesai, atau dalam proses

Setiap kasus menampilkan informasi: nama pengguna, jenis pelanggaran, tanggal kejadian, dan status penanganan.`
    },
    {
      id: 9,
      category: 'etik',
      question: 'Bagaimana cara mengekspor data etik & disiplin?',
      answer: `Untuk mengekspor data:

1. Buka halaman **Etik & Disiplin**
2. Gunakan filter untuk memilih data yang ingin diekspor (opsional)
3. Klik tombol **Ekspor** di bagian kanan atas
4. Pilih format ekspor (Excel/PDF)
5. File akan diunduh secara otomatis

Data yang diekspor akan sesuai dengan filter yang sedang aktif.`
    },

    // Alat PDF
    {
      id: 10,
      category: 'alat',
      question: 'Bagaimana cara mengkonversi gambar ke PDF?',
      answer: `Untuk mengkonversi gambar ke PDF:

1. Buka menu **Alat PDF** > **Gambar ke PDF**
2. Klik area upload atau drag & drop gambar
3. Anda dapat menambahkan beberapa gambar sekaligus
4. Atur urutan gambar dengan drag & drop jika diperlukan
5. Klik tombol **Konversi ke PDF**
6. File PDF akan diunduh secara otomatis

**Format yang didukung**: JPG, JPEG, PNG, WEBP`
    },
    {
      id: 11,
      category: 'alat',
      question: 'Bagaimana cara mengkompres file PDF?',
      answer: `Untuk mengkompres file PDF:

1. Buka menu **Alat PDF** > **Kompresi PDF**
2. Upload file PDF yang ingin dikompres
3. Pilih tingkat kompresi:
   - **Rendah**: Kualitas tinggi, pengurangan ukuran sedikit
   - **Sedang**: Keseimbangan kualitas dan ukuran
   - **Tinggi**: Ukuran file kecil, kualitas menurun
4. Klik tombol **Kompres**
5. File hasil kompresi akan diunduh

**Catatan**: Ukuran maksimal file yang dapat dikompres adalah 50MB.`
    },

    // Pengaturan
    {
      id: 12,
      category: 'pengaturan',
      question: 'Bagaimana cara menambah admin baru?',
      answer: `Untuk menambah admin baru:

1. Buka menu **Pengaturan** > **Akun Admin**
2. Klik tombol **Tambah Admin**
3. Isi formulir dengan data admin baru:
   - Nama lengkap
   - Username
   - Email
   - Password
   - Role admin
4. Klik **Simpan**

Admin baru akan menerima email notifikasi berisi kredensial login.`
    },
    {
      id: 13,
      category: 'pengaturan',
      question: 'Bagaimana cara mengubah password admin?',
      answer: `Untuk mengubah password:

1. Buka menu **Pengaturan** > **Akun Admin**
2. Cari akun yang ingin diubah passwordnya
3. Klik tombol **Edit** atau **Ubah Password**
4. Masukkan password baru (minimal 8 karakter)
5. Konfirmasi password baru
6. Klik **Simpan**

**Tips**: Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk password yang kuat.`
    },
    {
      id: 14,
      category: 'pengaturan',
      question: 'Bagaimana cara mengatur role dan hak akses?',
      answer: `Untuk mengatur role:

1. Buka menu **Pengaturan** > **Manajemen Role**
2. Anda akan melihat daftar role yang tersedia
3. Untuk membuat role baru, klik **Tambah Role**
4. Untuk mengedit role, klik tombol **Edit** pada role yang dipilih
5. Atur hak akses dengan mencentang/tidak mencentang permission
6. Klik **Simpan**

**Catatan**: Perubahan role akan mempengaruhi semua pengguna dengan role tersebut.`
    },
    {
      id: 15,
      category: 'pengaturan',
      question: 'Bagaimana cara melihat log aktivitas admin?',
      answer: `Log aktivitas dapat dilihat di:

1. Buka menu **Pengaturan** > **Akun Admin**
2. Scroll ke bagian **Log Aktivitas**
3. Log menampilkan:
   - Waktu aktivitas
   - Admin yang melakukan
   - Jenis aktivitas
   - Detail perubahan

Gunakan filter tanggal untuk melihat aktivitas pada periode tertentu.`
    },
  ];

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = activeCategory === 'semua' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Bantuan & FAQ</h1>
            <p className={styles.pageSubtitle}>
              Pertanyaan yang sering ditanyakan seputar penggunaan panel admin
            </p>
          </div>
        </header>

        {/* Search */}
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <MdSearch className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Categories */}
        <div className={styles.categoriesSection}>
          <div className={styles.categoriesList}>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Icon size={18} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        <div className={styles.faqSection}>
          {filteredFaqs.length === 0 ? (
            <Card className={styles.emptyCard}>
              <div className={styles.emptyState}>
                <MdHelp size={48} className={styles.emptyIcon} />
                <h3>Tidak ada hasil ditemukan</h3>
                <p>Coba ubah kata kunci pencarian atau pilih kategori lain</p>
              </div>
            </Card>
          ) : (
            <div className={styles.faqList}>
              {filteredFaqs.map(faq => (
                <Card key={faq.id} className={styles.faqCard}>
                  <button
                    className={styles.faqHeader}
                    onClick={() => toggleExpanded(faq.id)}
                  >
                    <div className={styles.faqQuestion}>
                      <MdHelp className={styles.questionIcon} size={20} />
                      <span>{faq.question}</span>
                    </div>
                    {expandedItems[faq.id] ? (
                      <MdKeyboardArrowUp size={24} className={styles.arrowIcon} />
                    ) : (
                      <MdKeyboardArrowDown size={24} className={styles.arrowIcon} />
                    )}
                  </button>
                  {expandedItems[faq.id] && (
                    <div className={styles.faqAnswer}>
                      <div className={styles.answerContent}>
                        <SafeMarkdown text={faq.answer} />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Help Contact */}
        <Card className={styles.helpCard}>
          <div className={styles.helpContent}>
            <div className={styles.helpInfo}>
              <h3>Masih butuh bantuan?</h3>
              <p>Jika pertanyaan Anda tidak terjawab, hubungi tim IT Support</p>
            </div>
            <div className={styles.helpContact}>
              <p><strong>Email:</strong> it.support@rspmgombong.com</p>
              <p><strong>WhatsApp:</strong> 0812-3456-7890</p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Faq;
