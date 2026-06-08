import{r,j as a}from"./main-lUK_GDvX.js";import{A as _}from"./AdminLayout-C8JkAcD6.js";import{C as o}from"./Card-c2Qw7-QF.js";import{S as y}from"./SafeMarkdown-3sEZujrq.js";import{k as f,y as u,_ as j,K as w,C as x,r as P,H as C,D as q,E as S}from"./index-CySOyJOT.js";import"./headerImg-yfljgS6N.js";const D="_container_1bz4i_3",A="_pageHeader_1bz4i_17",B="_headerContent_1bz4i_25",v="_pageTitle_1bz4i_37",z="_pageSubtitle_1bz4i_53",N="_searchSection_1bz4i_67",I="_searchBox_1bz4i_75",K="_searchIcon_1bz4i_85",F="_searchInput_1bz4i_101",M="_categoriesSection_1bz4i_143",L="_categoriesList_1bz4i_155",U="_categoryBtn_1bz4i_167",E="_active_1bz4i_209",H="_faqSection_1bz4i_223",T="_faqList_1bz4i_231",G="_faqCard_1bz4i_243",J="_faqHeader_1bz4i_263",R="_faqQuestion_1bz4i_297",Q="_questionIcon_1bz4i_311",W="_arrowIcon_1bz4i_337",$="_faqAnswer_1bz4i_347",O="_answerContent_1bz4i_359",V="_emptyCard_1bz4i_399",X="_emptyState_1bz4i_407",Y="_emptyIcon_1bz4i_421",Z="_helpCard_1bz4i_463",aa="_helpContent_1bz4i_473",na="_helpInfo_1bz4i_489",ea="_helpContact_1bz4i_515",n={container:D,pageHeader:A,headerContent:B,pageTitle:v,pageSubtitle:z,searchSection:N,searchBox:I,searchIcon:K,searchInput:F,categoriesSection:M,categoriesList:L,categoryBtn:U,active:E,faqSection:H,faqList:T,faqCard:G,faqHeader:J,faqQuestion:R,questionIcon:Q,arrowIcon:W,faqAnswer:$,answerContent:O,emptyCard:V,emptyState:X,emptyIcon:Y,helpCard:Z,helpContent:aa,helpInfo:na,helpContact:ea},la=()=>{const[t,m]=r.useState(""),[s,g]=r.useState("semua"),[l,c]=r.useState({}),k=[{id:"semua",label:"Semua",icon:u},{id:"dashboard",label:"Dashboard",icon:j},{id:"pengguna",label:"Manajemen Pengguna",icon:w},{id:"etik",label:"Etik & Disiplin",icon:x},{id:"alat",label:"Alat PDF",icon:P},{id:"pengaturan",label:"Pengaturan",icon:C}],p=[{id:1,category:"dashboard",question:"Bagaimana cara membaca statistik di Dashboard?",answer:`Dashboard menampilkan 4 statistik utama:
      
1. **Total Pengguna**: Jumlah seluruh pengguna yang terdaftar dalam sistem
2. **Pengguna Aktif**: Jumlah pengguna yang sudah melengkapi profil dan dokumen
3. **Kasus Etik/Disiplin**: Jumlah kasus etik dan disiplin yang perlu ditinjau
4. **Dokumen Segera Habis**: Jumlah dokumen yang akan kedaluwarsa dalam 90 hari ke depan

Klik pada setiap kartu statistik untuk melihat detail lebih lanjut.`},{id:2,category:"dashboard",question:"Apa arti warna pada dokumen yang segera kedaluwarsa?",answer:`Warna menunjukkan tingkat urgensi:
      
- **Merah**: Dokumen akan kedaluwarsa dalam 30 hari atau kurang
- **Kuning/Orange**: Dokumen akan kedaluwarsa dalam 31-60 hari
- **Hijau**: Dokumen akan kedaluwarsa dalam 61-90 hari

Prioritaskan untuk mengingatkan pengguna dengan dokumen berwarna merah terlebih dahulu.`},{id:3,category:"dashboard",question:"Bagaimana cara melihat aktivitas terbaru pengguna?",answer:`Pada bagian bawah Dashboard terdapat daftar "Aktivitas Terbaru" yang menampilkan:

- Pendaftaran pengguna baru
- Pembaruan dokumen
- Verifikasi email
- Pengunggahan dokumen

Daftar ini diperbarui secara otomatis setiap 30 detik. Anda juga dapat mengklik tombol refresh untuk memperbarui data secara manual.`},{id:4,category:"pengguna",question:"Bagaimana cara mencari pengguna tertentu?",answer:`Untuk mencari pengguna:

1. Buka halaman **Manajemen Pengguna** dari menu sidebar
2. Gunakan **kolom pencarian** di bagian atas tabel
3. Ketik nama, NIP, atau email pengguna yang dicari
4. Hasil pencarian akan muncul secara otomatis

Anda juga dapat menggunakan filter untuk menyaring berdasarkan status verifikasi atau role pengguna.`},{id:5,category:"pengguna",question:"Bagaimana cara melihat detail profil pengguna?",answer:`Untuk melihat detail profil pengguna:

1. Buka halaman **Manajemen Pengguna**
2. Cari pengguna yang ingin dilihat
3. Klik tombol **Lihat Detail** atau ikon mata pada baris pengguna
4. Halaman detail akan menampilkan:
   - Informasi pribadi
   - Dokumen yang diunggah
   - Riwayat pendidikan
   - Status kredensial
   - Riwayat etik & disiplin`},{id:6,category:"pengguna",question:"Bagaimana cara mengubah role pengguna?",answer:`Untuk mengubah role pengguna:

1. Buka halaman **Manajemen Pengguna**
2. Klik **Lihat Detail** pada pengguna yang ingin diubah
3. Pada halaman detail, cari bagian **Role Pengguna**
4. Pilih role baru dari dropdown yang tersedia
5. Klik **Simpan Perubahan**

**Catatan**: Perubahan role akan berlaku segera setelah pengguna login kembali.`},{id:7,category:"pengguna",question:"Bagaimana cara menonaktifkan akun pengguna?",answer:`Untuk menonaktifkan akun pengguna:

1. Buka halaman **Manajemen Pengguna**
2. Klik **Lihat Detail** pada pengguna yang ingin dinonaktifkan
3. Scroll ke bagian bawah halaman
4. Klik tombol **Nonaktifkan Akun**
5. Konfirmasi tindakan pada dialog yang muncul

Pengguna yang dinonaktifkan tidak akan dapat login ke sistem hingga akun diaktifkan kembali.`},{id:8,category:"etik",question:"Bagaimana cara melihat daftar kasus etik & disiplin?",answer:`Untuk melihat daftar kasus:

1. Klik menu **Etik & Disiplin** di sidebar
2. Halaman akan menampilkan tabel semua kasus yang tercatat
3. Gunakan tab untuk memfilter berdasarkan jenis (Etik/Disiplin)
4. Gunakan filter status untuk melihat kasus aktif, selesai, atau dalam proses

Setiap kasus menampilkan informasi: nama pengguna, jenis pelanggaran, tanggal kejadian, dan status penanganan.`},{id:9,category:"etik",question:"Bagaimana cara mengekspor data etik & disiplin?",answer:`Untuk mengekspor data:

1. Buka halaman **Etik & Disiplin**
2. Gunakan filter untuk memilih data yang ingin diekspor (opsional)
3. Klik tombol **Ekspor** di bagian kanan atas
4. Pilih format ekspor (Excel/PDF)
5. File akan diunduh secara otomatis

Data yang diekspor akan sesuai dengan filter yang sedang aktif.`},{id:10,category:"alat",question:"Bagaimana cara mengkonversi gambar ke PDF?",answer:`Untuk mengkonversi gambar ke PDF:

1. Buka menu **Alat PDF** > **Gambar ke PDF**
2. Klik area upload atau drag & drop gambar
3. Anda dapat menambahkan beberapa gambar sekaligus
4. Atur urutan gambar dengan drag & drop jika diperlukan
5. Klik tombol **Konversi ke PDF**
6. File PDF akan diunduh secara otomatis

**Format yang didukung**: JPG, JPEG, PNG, WEBP`},{id:11,category:"alat",question:"Bagaimana cara mengkompres file PDF?",answer:`Untuk mengkompres file PDF:

1. Buka menu **Alat PDF** > **Kompresi PDF**
2. Upload file PDF yang ingin dikompres
3. Pilih tingkat kompresi:
   - **Rendah**: Kualitas tinggi, pengurangan ukuran sedikit
   - **Sedang**: Keseimbangan kualitas dan ukuran
   - **Tinggi**: Ukuran file kecil, kualitas menurun
4. Klik tombol **Kompres**
5. File hasil kompresi akan diunduh

**Catatan**: Ukuran maksimal file yang dapat dikompres adalah 50MB.`},{id:12,category:"pengaturan",question:"Bagaimana cara menambah admin baru?",answer:`Untuk menambah admin baru:

1. Buka menu **Pengaturan** > **Akun Admin**
2. Klik tombol **Tambah Admin**
3. Isi formulir dengan data admin baru:
   - Nama lengkap
   - Username
   - Email
   - Password
   - Role admin
4. Klik **Simpan**

Admin baru akan menerima email notifikasi berisi kredensial login.`},{id:13,category:"pengaturan",question:"Bagaimana cara mengubah password admin?",answer:`Untuk mengubah password:

1. Buka menu **Pengaturan** > **Akun Admin**
2. Cari akun yang ingin diubah passwordnya
3. Klik tombol **Edit** atau **Ubah Password**
4. Masukkan password baru (minimal 8 karakter)
5. Konfirmasi password baru
6. Klik **Simpan**

**Tips**: Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk password yang kuat.`},{id:14,category:"pengaturan",question:"Bagaimana cara mengatur role dan hak akses?",answer:`Untuk mengatur role:

1. Buka menu **Pengaturan** > **Manajemen Role**
2. Anda akan melihat daftar role yang tersedia
3. Untuk membuat role baru, klik **Tambah Role**
4. Untuk mengedit role, klik tombol **Edit** pada role yang dipilih
5. Atur hak akses dengan mencentang/tidak mencentang permission
6. Klik **Simpan**

**Catatan**: Perubahan role akan mempengaruhi semua pengguna dengan role tersebut.`},{id:15,category:"pengaturan",question:"Bagaimana cara melihat log aktivitas admin?",answer:`Log aktivitas dapat dilihat di:

1. Buka menu **Pengaturan** > **Akun Admin**
2. Scroll ke bagian **Log Aktivitas**
3. Log menampilkan:
   - Waktu aktivitas
   - Admin yang melakukan
   - Jenis aktivitas
   - Detail perubahan

Gunakan filter tanggal untuk melihat aktivitas pada periode tertentu.`}],h=e=>{c(i=>({...i,[e]:!i[e]}))},d=p.filter(e=>{const i=s==="semua"||e.category===s,b=t===""||e.question.toLowerCase().includes(t.toLowerCase())||e.answer.toLowerCase().includes(t.toLowerCase());return i&&b});return a.jsx(_,{children:a.jsxs("div",{className:n.container,children:[a.jsx("header",{className:n.pageHeader,children:a.jsxs("div",{className:n.headerContent,children:[a.jsx("h1",{className:n.pageTitle,children:"Bantuan & FAQ"}),a.jsx("p",{className:n.pageSubtitle,children:"Pertanyaan yang sering ditanyakan seputar penggunaan panel admin"})]})}),a.jsx("div",{className:n.searchSection,children:a.jsxs("div",{className:n.searchBox,children:[a.jsx(f,{className:n.searchIcon,size:20}),a.jsx("input",{type:"text",placeholder:"Cari pertanyaan...",value:t,onChange:e=>m(e.target.value),className:n.searchInput})]})}),a.jsx("div",{className:n.categoriesSection,children:a.jsx("div",{className:n.categoriesList,children:k.map(e=>{const i=e.icon;return a.jsxs("button",{className:`${n.categoryBtn} ${s===e.id?n.active:""}`,onClick:()=>g(e.id),children:[a.jsx(i,{size:18}),a.jsx("span",{children:e.label})]},e.id)})})}),a.jsx("div",{className:n.faqSection,children:d.length===0?a.jsx(o,{className:n.emptyCard,children:a.jsxs("div",{className:n.emptyState,children:[a.jsx(u,{size:48,className:n.emptyIcon}),a.jsx("h3",{children:"Tidak ada hasil ditemukan"}),a.jsx("p",{children:"Coba ubah kata kunci pencarian atau pilih kategori lain"})]})}):a.jsx("div",{className:n.faqList,children:d.map(e=>a.jsxs(o,{className:n.faqCard,children:[a.jsxs("button",{className:n.faqHeader,onClick:()=>h(e.id),children:[a.jsxs("div",{className:n.faqQuestion,children:[a.jsx(u,{className:n.questionIcon,size:20}),a.jsx("span",{children:e.question})]}),l[e.id]?a.jsx(q,{size:24,className:n.arrowIcon}):a.jsx(S,{size:24,className:n.arrowIcon})]}),l[e.id]&&a.jsx("div",{className:n.faqAnswer,children:a.jsx("div",{className:n.answerContent,children:a.jsx(y,{text:e.answer})})})]},e.id))})}),a.jsx(o,{className:n.helpCard,children:a.jsxs("div",{className:n.helpContent,children:[a.jsxs("div",{className:n.helpInfo,children:[a.jsx("h3",{children:"Masih butuh bantuan?"}),a.jsx("p",{children:"Jika pertanyaan Anda tidak terjawab, hubungi tim IT Support"})]}),a.jsxs("div",{className:n.helpContact,children:[a.jsxs("p",{children:[a.jsx("strong",{children:"Email:"})," it.support@rspmgombong.com"]}),a.jsxs("p",{children:[a.jsx("strong",{children:"WhatsApp:"})," 0812-3456-7890"]})]})]})})]})})};export{la as default};
