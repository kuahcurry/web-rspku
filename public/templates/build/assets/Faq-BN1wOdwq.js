import{u as P,r,i as y,j as a}from"./main-lUK_GDvX.js";import{M as w,I as _}from"./MainLayout-Cmp-wu-h.js";import{C as d}from"./Card-c2Qw7-QF.js";import{S as j}from"./SafeMarkdown-3sEZujrq.js";import{k as K,y as o,z as S,A,u as B,B as x,m as D,C,r as q,D as I,E as N}from"./index-CySOyJOT.js";import"./headerImg-yfljgS6N.js";const v="_container_17hfe_3",F="_pageHeader_17hfe_17",T="_headerContent_17hfe_25",M="_pageTitle_17hfe_37",U="_pageSubtitle_17hfe_53",L="_searchSection_17hfe_69",E="_searchBox_17hfe_77",R="_searchIcon_17hfe_87",J="_searchInput_17hfe_103",H="_categoriesSection_17hfe_145",z="_categoriesList_17hfe_157",G="_categoryBtn_17hfe_169",Q="_active_17hfe_211",$="_faqSection_17hfe_225",W="_faqList_17hfe_233",O="_faqCard_17hfe_245",V="_faqHeader_17hfe_265",X="_faqQuestion_17hfe_307",Y="_questionIcon_17hfe_321",Z="_arrowIcon_17hfe_347",aa="_faqAnswer_17hfe_357",na="_answerContent_17hfe_369",ea="_emptyCard_17hfe_409",ia="_emptyState_17hfe_417",sa="_emptyIcon_17hfe_431",ta="_helpCard_17hfe_471",ra="_helpContent_17hfe_481",da="_helpInfo_17hfe_497",oa="_helpContact_17hfe_523",n={container:v,pageHeader:F,headerContent:T,pageTitle:M,pageSubtitle:U,searchSection:L,searchBox:E,searchIcon:R,searchInput:J,categoriesSection:H,categoriesList:z,categoryBtn:G,active:Q,faqSection:$,faqList:W,faqCard:O,faqHeader:V,faqQuestion:X,questionIcon:Y,arrowIcon:Z,faqAnswer:aa,answerContent:na,emptyCard:ea,emptyState:ia,emptyIcon:sa,helpCard:ta,helpContent:ra,helpInfo:da,helpContact:oa},ca=()=>{const u=P(),[s,m]=r.useState(""),[t,g]=r.useState("semua"),[l,p]=r.useState({});if(!y())return u("/login"),null;const c=[{id:"semua",label:"Semua",icon:o},{id:"beranda",label:"Beranda",icon:S},{id:"profil",label:"Profil",icon:A},{id:"dokumen",label:"Dokumen",icon:B},{id:"pendidikan",label:"Pendidikan",icon:x},{id:"penugasan",label:"Penugasan",icon:D},{id:"kredensial",label:"Kredensial",icon:_},{id:"etik",label:"Etik & Disiplin",icon:C},{id:"alat",label:"Alat PDF",icon:q}],h=[{id:1,category:"beranda",question:"Apa saja informasi yang ditampilkan di Beranda?",answer:`Beranda menampilkan ringkasan informasi penting Anda:

1. **Profil Singkat**: Foto, nama, dan jabatan Anda
2. **Progress Kelengkapan Data**: Persentase kelengkapan setiap bagian data
3. **Dokumen Segera Kedaluwarsa**: Daftar dokumen yang akan habis masa berlakunya
4. **Notifikasi Penting**: Pemberitahuan terkait akun dan dokumen Anda

Klik pada setiap bagian untuk langsung menuju halaman terkait.`},{id:2,category:"beranda",question:"Bagaimana cara membaca progress kelengkapan data?",answer:`Progress kelengkapan ditampilkan dalam bentuk persentase dan diagram:

- **100%**: Data sudah lengkap (warna hijau)
- **50-99%**: Data sebagian lengkap (warna kuning)
- **0-49%**: Data belum lengkap (warna merah)

Setiap bagian memiliki indikator tersendiri:
• Data Pribadi
• Dokumen Legalitas
• Pendidikan & Prestasi
• Penugasan
• Kredensial & Kewenangan
• Etik & Disiplin

Klik pada bagian yang belum lengkap untuk melengkapi data Anda.`},{id:3,category:"profil",question:"Bagaimana cara mengubah foto profil?",answer:`Untuk mengubah foto profil:

1. Buka halaman **Profil Saya** dari menu sidebar
2. Klik ikon kamera atau foto profil Anda saat ini
3. Pilih foto dari perangkat Anda
4. Atur posisi foto jika diperlukan (crop)
5. Klik **Simpan**

**Ketentuan foto**:
- Format: JPG, JPEG, atau PNG
- Ukuran maksimal: 2MB
- Disarankan foto formal dengan latar polos`},{id:4,category:"profil",question:"Bagaimana cara memperbarui data pribadi?",answer:`Untuk memperbarui data pribadi:

1. Buka halaman **Profil Saya**
2. Klik tombol **Edit Profil** atau ikon pensil
3. Ubah data yang ingin diperbarui:
   - Nama lengkap
   - Tempat & tanggal lahir
   - Alamat
   - No. telepon
   - Email (memerlukan verifikasi ulang)
4. Klik **Simpan Perubahan**

**Catatan**: Beberapa data seperti NIP tidak dapat diubah sendiri. Hubungi admin jika perlu perubahan.`},{id:5,category:"profil",question:"Kenapa email saya tidak bisa diubah?",answer:`Email adalah identitas utama akun Anda dan memerlukan proses verifikasi ulang jika diubah.

Untuk mengubah email:

1. Buka **Profil Saya** > **Edit Profil**
2. Masukkan email baru
3. Sistem akan mengirim kode verifikasi ke email baru
4. Masukkan kode verifikasi untuk mengonfirmasi
5. Email baru akan aktif setelah verifikasi berhasil

Jika mengalami kendala, hubungi admin untuk bantuan.`},{id:6,category:"dokumen",question:"Dokumen apa saja yang harus diunggah?",answer:`Dokumen yang perlu diunggah bergantung pada profesi Anda:

**Dokumen Umum (Semua Profesi)**:
- KTP
- Ijazah terakhir
- Sertifikat kompetensi

**Tenaga Medis (Dokter)**:
- STR (Surat Tanda Registrasi)
- SIP (Surat Izin Praktik)
- Sertifikat ATLS/ACLS (jika ada)

**Tenaga Kesehatan (Perawat, Bidan, dll)**:
- STR sesuai profesi
- SIP sesuai profesi
- Sertifikat pelatihan khusus

Pastikan dokumen yang diunggah masih berlaku.`},{id:7,category:"dokumen",question:"Bagaimana cara mengunggah dokumen?",answer:`Untuk mengunggah dokumen:

1. Buka halaman **Dokumen Legalitas** dari menu sidebar
2. Pilih jenis dokumen yang ingin diunggah
3. Klik tombol **Unggah** atau area upload
4. Pilih file dari perangkat Anda
5. Isi informasi dokumen:
   - Nomor dokumen
   - Tanggal terbit
   - Tanggal kedaluwarsa
6. Klik **Simpan**

**Format yang didukung**: PDF, JPG, PNG
**Ukuran maksimal**: 5MB per file`},{id:8,category:"dokumen",question:"Bagaimana jika dokumen saya sudah kedaluwarsa?",answer:`Jika dokumen Anda sudah atau akan kedaluwarsa:

1. Sistem akan mengirim notifikasi **90, 60, dan 30 hari** sebelum kedaluwarsa
2. Perpanjang dokumen Anda di instansi terkait
3. Setelah mendapat dokumen baru, unggah ke sistem
4. Dokumen lama akan otomatis ditandai sebagai "Tidak Aktif"

**Tips**: Perhatikan tanggal kedaluwarsa di Beranda untuk mencegah dokumen habis masa berlakunya.`},{id:9,category:"dokumen",question:"Bagaimana cara melihat dokumen yang sudah diunggah?",answer:`Untuk melihat dokumen yang sudah diunggah:

1. Buka halaman **Dokumen Legalitas**
2. Anda akan melihat daftar semua dokumen
3. Klik pada dokumen untuk melihat detail
4. Klik tombol **Lihat** atau ikon mata untuk membuka file
5. Anda juga dapat mengunduh dokumen dengan klik **Unduh**

Dokumen ditampilkan dengan status: Aktif (hijau), Segera Habis (kuning), atau Habis (merah).`},{id:10,category:"pendidikan",question:"Bagaimana cara menambah riwayat pendidikan?",answer:`Untuk menambah riwayat pendidikan:

1. Buka menu **Pendidikan dan Prestasi** > **Pendidikan & Pelatihan**
2. Klik tombol **Tambah Pendidikan**
3. Isi formulir:
   - Jenis (Formal/Non-Formal)
   - Jenjang pendidikan
   - Nama institusi
   - Jurusan/Program studi
   - Tahun masuk & lulus
   - Upload ijazah/sertifikat
4. Klik **Simpan**

Anda dapat menambah beberapa riwayat pendidikan.`},{id:11,category:"pendidikan",question:"Bagaimana cara menambah prestasi atau penghargaan?",answer:`Untuk menambah prestasi/penghargaan:

1. Buka menu **Pendidikan dan Prestasi** > **Prestasi & Penghargaan**
2. Pilih tab yang sesuai (Prestasi/Penghargaan/Kompetensi Utama)
3. Klik tombol **Tambah**
4. Isi informasi:
   - Nama prestasi/penghargaan
   - Pemberi/Penyelenggara
   - Tanggal perolehan
   - Tingkat (Lokal/Nasional/Internasional)
   - Upload bukti/sertifikat
5. Klik **Simpan**

Prestasi akan ditampilkan di profil Anda.`},{id:12,category:"penugasan",question:"Bagaimana cara menambah riwayat penugasan?",answer:`Untuk menambah riwayat penugasan:

1. Buka halaman **Penugasan** dari menu sidebar
2. Pilih tab yang sesuai (Penugasan/Pengabdian)
3. Klik tombol **Tambah**
4. Isi formulir:
   - Unit/Bagian penugasan
   - Jabatan
   - Tanggal mulai & selesai (kosongkan jika masih aktif)
   - Deskripsi tugas
   - Upload SK penugasan (jika ada)
5. Klik **Simpan**

Riwayat penugasan akan ditampilkan secara kronologis.`},{id:13,category:"penugasan",question:"Apa perbedaan Penugasan dan Pengabdian?",answer:`**Penugasan** adalah penempatan kerja resmi di dalam instansi:
- Penugasan di unit/bagian tertentu
- Rotasi kerja
- Tugas tambahan struktural

**Pengabdian** adalah kegiatan di luar tugas pokok:
- Pengabdian masyarakat
- Kegiatan sosial
- Relawan bencana
- Bakti sosial kesehatan

Keduanya penting untuk dokumentasi karir dan penilaian kinerja Anda.`},{id:14,category:"kredensial",question:"Apa itu Kredensial dan Rekredensial?",answer:`**Kredensial** adalah proses penilaian kompetensi dan kewenangan klinis tenaga kesehatan untuk memberikan pelayanan di rumah sakit.

**Rekredensial** adalah proses evaluasi ulang kredensial yang dilakukan secara berkala (biasanya setiap 3 tahun) untuk memastikan tenaga kesehatan tetap kompeten.

Proses ini meliputi:
- Evaluasi dokumen legalitas
- Penilaian kompetensi
- Rekomendasi Komite Medik/Keperawatan
- Penetapan Kewenangan Klinis

Status kredensial mempengaruhi kewenangan Anda dalam memberikan pelayanan.`},{id:15,category:"kredensial",question:"Apa itu SPK dan RKK?",answer:`**SPK (Surat Penugasan Klinis)** adalah surat yang dikeluarkan direktur rumah sakit yang memberikan wewenang kepada tenaga medis untuk melakukan pelayanan klinis.

**RKK (Rincian Kewenangan Klinis)** adalah daftar rinci tindakan klinis yang boleh dilakukan oleh tenaga medis berdasarkan kompetensinya.

Keduanya saling terkait:
- SPK adalah dokumen penugasan
- RKK adalah lampiran yang merinci kewenangan

Anda dapat melihat dan mengelola dokumen ini di menu **Kredensial & Kewenangan Klinis** > **Status Kewenangan (SPK/RKK)**.`},{id:16,category:"kredensial",question:"Bagaimana cara mengajukan kredensial/rekredensial?",answer:`Untuk mengajukan kredensial/rekredensial:

1. Buka menu **Kredensial & Kewenangan Klinis** > **Kredensial/Rekredensial**
2. Pastikan semua dokumen pendukung sudah lengkap
3. Klik tombol **Ajukan Kredensial** atau **Ajukan Rekredensial**
4. Sistem akan memeriksa kelengkapan dokumen
5. Jika lengkap, pengajuan akan diproses Komite terkait
6. Pantau status pengajuan di halaman yang sama

**Dokumen yang diperlukan**:
- STR aktif
- SIP aktif
- Sertifikat pelatihan terkini
- Log book (jika diperlukan)`},{id:17,category:"etik",question:"Apa itu catatan Etik & Disiplin?",answer:`Halaman Etik & Disiplin menampilkan riwayat dan status terkait:

**Etik**: Berkaitan dengan kode etik profesi
- Pelanggaran etik profesi
- Sanksi dari organisasi profesi
- Pembinaan etik

**Disiplin**: Berkaitan dengan peraturan rumah sakit
- Pelanggaran disiplin kerja
- Sanksi administratif
- Pembinaan karyawan

Catatan ini bersifat rahasia dan hanya dapat dilihat oleh Anda dan admin yang berwenang.`},{id:18,category:"etik",question:"Kenapa ada catatan di halaman Etik & Disiplin saya?",answer:`Catatan di halaman Etik & Disiplin muncul jika:

1. Terdapat laporan/pengaduan yang melibatkan Anda
2. Anda pernah mendapat pembinaan atau sanksi
3. Ada proses pemeriksaan yang sedang berjalan

Anda dapat melihat:
- Detail kejadian
- Status penanganan
- Keputusan/sanksi (jika ada)
- Tanggal berakhir sanksi

Jika ada pertanyaan tentang catatan Anda, hubungi bagian SDM atau Komite terkait.`},{id:19,category:"alat",question:"Bagaimana cara mengkonversi gambar ke PDF?",answer:`Untuk mengkonversi gambar ke PDF:

1. Buka menu **Alat PDF** > **Gambar ke PDF**
2. Klik area upload atau drag & drop gambar
3. Anda dapat menambahkan beberapa gambar sekaligus
4. Atur urutan gambar dengan drag & drop
5. Pilih orientasi (Portrait/Landscape) jika diperlukan
6. Klik tombol **Konversi ke PDF**
7. File PDF akan diunduh otomatis

**Format yang didukung**: JPG, JPEG, PNG, WEBP
**Tips**: Sangat berguna untuk menggabungkan beberapa scan dokumen.`},{id:20,category:"alat",question:"Bagaimana cara mengkompres file PDF?",answer:`Untuk mengkompres file PDF:

1. Buka menu **Alat PDF** > **Kompresi File PDF**
2. Upload file PDF yang ingin dikompres
3. Pilih tingkat kompresi:
   - **Rendah**: Kualitas tinggi, ukuran berkurang sedikit
   - **Sedang**: Keseimbangan kualitas dan ukuran
   - **Tinggi**: Ukuran kecil, kualitas menurun
4. Klik **Kompres**
5. File hasil kompresi akan diunduh

**Ukuran maksimal file**: 50MB
**Tips**: Gunakan untuk mengecilkan file sebelum upload ke sistem.`},{id:21,category:"alat",question:"Bagaimana cara mencetak dokumen ke PDF?",answer:`Fitur Cetak PDF memungkinkan Anda mencetak data tertentu ke format PDF:

1. Buka menu **Alat PDF** > **Cetak PDF**
2. Pilih jenis data yang ingin dicetak:
   - Profil lengkap
   - Daftar dokumen
   - Riwayat pendidikan
   - dll.
3. Atur opsi cetak jika tersedia
4. Klik **Cetak ke PDF**
5. File PDF akan dibuat dan diunduh

**Tips**: Berguna untuk membuat salinan data atau keperluan pelaporan.`},{id:22,category:"beranda",question:"Bagaimana cara mengubah password?",answer:`Untuk mengubah password:

1. Klik foto profil di pojok kanan atas
2. Pilih **Pengaturan** dari dropdown
3. Buka tab **Keamanan** atau **Ubah Password**
4. Masukkan password lama
5. Masukkan password baru (minimal 8 karakter)
6. Konfirmasi password baru
7. Klik **Simpan**

**Tips password yang kuat**:
- Minimal 8 karakter
- Kombinasi huruf besar dan kecil
- Sertakan angka dan simbol
- Hindari informasi pribadi (tanggal lahir, nama)`},{id:23,category:"beranda",question:"Bagaimana jika lupa password?",answer:`Jika Anda lupa password:

1. Di halaman login, klik **Lupa Password?**
2. Masukkan email yang terdaftar
3. Sistem akan mengirim link reset password ke email
4. Buka email dan klik link yang diberikan (berlaku 1 jam)
5. Masukkan password baru
6. Konfirmasi password baru
7. Klik **Reset Password**
8. Login dengan password baru

**Catatan**: Jika tidak menerima email, periksa folder spam atau hubungi admin.`}],b=e=>{p(i=>({...i,[e]:!i[e]}))},k=h.filter(e=>{const i=t==="semua"||e.category===t,f=s===""||e.question.toLowerCase().includes(s.toLowerCase())||e.answer.toLowerCase().includes(s.toLowerCase());return i&&f});return a.jsxs(w,{children:[a.jsx("header",{className:n.pageHeader,children:a.jsxs("div",{className:n.headerContent,children:[a.jsx("h1",{className:n.pageTitle,children:"Bantuan & FAQ"}),a.jsx("p",{className:n.pageSubtitle,children:"Pertanyaan yang sering ditanyakan seputar penggunaan aplikasi"})]})}),a.jsxs("div",{className:n.container,children:[a.jsx("div",{className:n.searchSection,children:a.jsxs("div",{className:n.searchBox,children:[a.jsx(K,{className:n.searchIcon,size:20}),a.jsx("input",{type:"text",placeholder:"Cari pertanyaan...",value:s,onChange:e=>m(e.target.value),className:n.searchInput})]})}),a.jsx("div",{className:n.categoriesSection,children:a.jsx("div",{className:n.categoriesList,children:c.map(e=>{const i=e.icon;return a.jsxs("button",{className:`${n.categoryBtn} ${t===e.id?n.active:""}`,onClick:()=>g(e.id),children:[a.jsx(i,{size:18}),a.jsx("span",{children:e.label})]},e.id)})})}),a.jsx("div",{className:n.faqSection,children:k.length===0?a.jsx(d,{className:n.emptyCard,children:a.jsxs("div",{className:n.emptyState,children:[a.jsx(o,{size:48,className:n.emptyIcon}),a.jsx("h3",{children:"Tidak ada hasil ditemukan"}),a.jsx("p",{children:"Coba ubah kata kunci pencarian atau pilih kategori lain"})]})}):a.jsx("div",{className:n.faqList,children:k.map(e=>a.jsxs(d,{className:n.faqCard,children:[a.jsxs("button",{className:n.faqHeader,onClick:()=>b(e.id),children:[a.jsxs("div",{className:n.faqQuestion,children:[a.jsx(o,{className:n.questionIcon,size:20}),a.jsx("span",{children:e.question})]}),l[e.id]?a.jsx(I,{size:24,className:n.arrowIcon}):a.jsx(N,{size:24,className:n.arrowIcon})]}),l[e.id]&&a.jsx("div",{className:n.faqAnswer,children:a.jsx("div",{className:n.answerContent,children:a.jsx(j,{text:e.answer})})})]},e.id))})}),a.jsx(d,{className:n.helpCard,children:a.jsxs("div",{className:n.helpContent,children:[a.jsxs("div",{className:n.helpInfo,children:[a.jsx("h3",{children:"Masih butuh bantuan?"}),a.jsx("p",{children:"Jika pertanyaan Anda tidak terjawab, hubungi tim IT Support"})]}),a.jsxs("div",{className:n.helpContact,children:[a.jsxs("p",{children:[a.jsx("strong",{children:"Email Bantuan 1:"})," tbot691@gmail.com"]}),a.jsxs("p",{children:[a.jsx("strong",{children:"Email Bantuan 2:"})," dzakaal10@gmail.com"]})]})]})})]})]})};export{ca as default};
