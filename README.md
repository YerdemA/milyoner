# Bilgi Yarışması (geçici ad)

> ⚠️ **Geliştirme aşamasında.** Bu README geçicidir; proje ilerledikçe güncellenecek.

Hemşirelik dersinde kullanılmak üzere hazırlanan, **sınıf içi çoktan seçmeli bilgi yarışması**.
Tek bir bilgisayardan açılır ve projeksiyonla tahtaya yansıtılır. Öğrenciler cevabı sözlü verir,
sunucu seçilen şıkkı bilgisayardan işaretler. Öğrencilerin kendi cihazlarından bağlanması gerekmez.

Proje kararları, kapsam ve açık noktalar için: [`CLAUDE.md`](./CLAUDE.md)

## Özellikler (planlanan)

- Bir veya birden çok **soru havuzundan** rastgele, tekrarsız soru seçimi
- İsteğe bağlı **süre sınırı** ve görsel geri sayım
- Projeksiyona uygun büyük, okunaklı **yarışma ekranı**; fare ve klavye (A–D / 1–4, Enter) ile kullanım
- Doğru/yanlış için **animasyon ve ses efektleri**, yarışma sonunda özet ekranı
- Şifre korumalı **yönetim paneli**: havuz ve soru ekleme/düzenleme/silme, ayarlar

## Teknolojiler

| Katman | Seçim |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Stil / Animasyon | Tailwind CSS 4 / Framer Motion |
| Veritabanı / Giriş | Firebase Firestore / Firebase Auth (ücretsiz Spark planı) |
| Yayın | Vercel (ücretsiz Hobby planı) |

## Yerel kurulum

Gereksinimler: Node.js 20+ ve npm.

```powershell
git clone https://github.com/YerdemA/milyoner.git
cd milyoner
npm install
Copy-Item .env.example .env.local   # değerleri Firebase konsolundan doldurun
npm run dev                          # http://localhost:3000
```

`.env.local` değerleri: Firebase konsolu → Proje ayarları → Genel → Uygulamalarınız → SDK yapılandırması.
Bu dosya **asla commit edilmez**.

### Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run start` | Derlenmiş uygulamayı çalıştırır |
| `npm run lint` | ESLint kontrolü |

## Sayfalar

| Adres | İçerik |
|---|---|
| `/` | Yarışma kurulumu (havuz, süre, soru sayısı) |
| `/yarisma` | Yarışma ekranı (projeksiyon) ve özet |
| `/admin/giris` | Yönetici girişi |
| `/admin` | Soru havuzları |
| `/admin/havuzlar/[poolId]` | Havuzdaki sorular |
| `/admin/ayarlar` | Ayarlar |

## Klasör yapısı

```
src/
  app/              sayfalar (route'lar)
  components/
    ui/             ortak bileşenler
    quiz/           yarışma ekranı bileşenleri
    admin/          yönetim paneli bileşenleri
  hooks/            ortak React hook'ları
  lib/firebase.ts   Firebase bağlantısı
  types/            TypeScript tipleri
public/sounds/      ses efektleri (kaynakları CREDITS.md'de)
```

## Yol haritası

- [x] 1. Proje iskeleti ve Firebase bağlantısı
- [ ] 2. Veri modeli ve Firestore güvenlik kuralları
- [ ] 3. Yönetim paneli
- [ ] 4. Yarışma kurulum ekranı
- [ ] 5. Yarışma ekranı, animasyonlar ve sesler
- [ ] 6. Vercel'e yayın
