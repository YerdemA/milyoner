# CLAUDE.md: Kim Milyoner (Sınıf İçi Bilgi Yarışması)

Bu dosya, projede birlikte çalışacağın Claude Code için bağlam ve kurallardır. Kararların gerekçesini burada bul. **Burada karar verilmemiş bir konuya geldiğinde varsayım yapma, önce bana (Erdem) sor.** Küçük ve geri alınabilir uygulama detaylarında inisiyatif al, ne yaptığını kısaca belirt.

## 1. Proje özeti

Hemşirelik öğrencisi bir arkadaşım için, derste kullanılacak çoktan seçmeli bir bilgi yarışması web uygulaması.

- **Kullanım şekli:** Sınıfta tek bir bilgisayardan açılır ve projeksiyonla tahtaya yansıtılır. Bütün sınıf yansıdan takip eder. Cevaplar sözlü verilir ve sunucu (öğretim üyesi/öğrenci) seçilen şıkkı bilgisayardan işaretler.
- Öğrenciler kendi cihazlarından **bağlanmaz**. Kullanıcı girişi, çok oyunculu bağlantı veya gerçek zamanlı senkronizasyon yoktur.
- Kullanıcılar teknik değil. Her şey açık, büyük ve kendini anlatan bir arayüzle yapılmalı.
- Tek seferlik/dönemlik bir proje. Uzun süreli geliştirme planı yok, bu yüzden **basitlik ve bakım gerektirmemek** önceliklidir.
- **Bütçe sıfır.** Yalnızca ücretsiz katmanlar kullanılacak. Kart bilgisi gerektiren hiçbir servis/plan kullanılmayacak.

## 2. Teknoloji yığını

| Katman | Seçim | Gerekçe |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Erdem'in ana yığını. Vercel ile sorunsuz. |
| Stil | **Tailwind CSS** | Hızlı ve tutarlı arayüz geliştirme. |
| Animasyon | **Framer Motion** | Doğru/yanlış ve geçiş animasyonları. |
| Ses | **Web Audio API ile sentez** (`src/lib/sound.ts`) | Ses dosyası yok: özgün, lisans derdi yok, önceden yükleme gerekmez. Dosyaya geçilirse CC0 kaynak + `public/sounds/CREDITS.md`. |
| Veritabanı | **Firebase Firestore** (Spark / ücretsiz plan) | Sunucu yönetimi yok, ücretsiz kota bu ölçek için fazlasıyla yeterli. |
| Kimlik doğrulama | **Firebase Auth (e-posta/şifre)** | Sadece admin paneli için. |
| Excel | **read-excel-file** / **write-excel-file** | Soru içe/dışa aktarma; aynı yazarın küçük paketleri, ihtiyaç anında yüklenir. |
| Çevrimdışı | **Firestore IndexedDB önbelleği** + `public/sw.js` | İnternet kesilince yarışma devam eder; ek kütüphane yok. |
| Yayın | **Vercel** (Hobby / ücretsiz) | Linkle paylaşım. |

Kurulum ve mimari ayrıntıları `docs/README.md` içinde. Yeni bir kütüphane eklemeden önce gerekçesini söyle. Küçük ve yaygın yardımcı paketlerde sorman gerekmez.

## 3. Özellikler

### 3.1 Yarışma kurulumu (başlatma ekranı)
- Bir veya birden fazla **soru havuzu** seçilir.
- **Süre sınırı** açılıp kapatılabilir. Açıksa varsayılan süre admin ayarından gelir ve burada değiştirilebilir.
- Seçilen havuzlardan sorular **rastgele** çekilir ve aynı yarışmada bir soru tekrar etmez.
- Kaç soru sorulacağı belirlenebilir *(varsayılanı ve üst sınırı → AÇIK NOKTA)*.

### 3.2 Yarışma ekranı (projeksiyon modu)
- Soru metni ve şıklar uzak sıralardan rahatça okunacak büyüklükte olmalı. 16:9 ekrana ve projeksiyonun düşük kontrastına göre tasarla.
- Tam ekran modu için belirgin bir buton olmalı.
- Şık seçimi fareyle ve **klavyeyle** yapılabilmeli (A/B/C/D veya 1–4). Sonraki soruya geçiş için Enter/boşluk kullanılabilmeli.
- Seçimden sonra kısa bir gerilim anı olmalı, ardından doğru/yanlış açıklanmalı. **Doğru ve yanlış için etkileyici animasyon ve ses efektleri** bu projenin en önemli kısmıdır.
- Süre sınırı açıksa görsel bir geri sayım ve son saniyelerde ses/uyarı olmalı. Süre dolunca davranış *(AÇIK NOKTA)*.
- Yarışma sonunda bir özet ekranı olmalı (doğru/yanlış sayısı vb.).
- Ses aç/kapat butonu her zaman erişilebilir olmalı.

### 3.3 Admin paneli
- Firebase Auth ile korunur. Tek (veya birkaç) admin hesabı, Firebase konsolundan elle oluşturulur. Kayıt ekranı **yok**.
- **Soru havuzları:** oluşturma, adını değiştirme, silme. Silme işleminde onay iste ve içindeki soruların ne olacağını açıkça göster.
- **Sorular:** havuz içinde ekleme, düzenleme, silme, listeleme ve arama.
- **Ayarlar:** varsayılan süre sınırı değeri vb.
- Toplu soru ekleme (ör. Excel/CSV içe aktarma) kullanışlı olabilir *(AÇIK NOKTA, sorular bize hangi formatta gelecek?)*.
- Form doğrulaması olmalı: boş şık olamaz, tam olarak bir doğru cevap seçilmeli.

## 4. Veri modeli (Firestore, başlangıç önerisi)

```
pools/{poolId}
  name: string
  createdAt: Timestamp

questions/{questionId}
  poolId: string
  text: string
  imageUrl: string | null        // şimdilik null, ileride görsel desteği için
  options: string[]              // şık metinleri (2–6 arası, varsayılan 4)
  correctIndex: number
  explanation: string | null     // isteğe bağlı açıklama/bilgi notu, cevaptan sonra gösterilir
  createdAt: Timestamp
  updatedAt: Timestamp

settings/app
  defaultTimeLimitSec: number    // 5–300 sn, belge yoksa 30

admins/{uid}                     // varsa o kullanıcı admindir; Firebase konsolundan elle oluşturulur
```

- Tipler `src/types`, okuma/yazma fonksiyonları `src/lib/firestore/`, doğrulama limitleri `src/lib/validation.ts` içinde. Limitler `firestore.rules` ile senkron tutulmalı.
- Havuz silinince içindeki sorular da silinir.

- **Görsel desteği:** Altyapı görsele hazır kurulacak (`imageUrl` alanı ve arayüzde görsel alanı için yer). Sorular şimdilik metin olacak. Görsellerin *nerede barındırılacağı* henüz karar verilmedi *(AÇIK NOKTA)*. Not: yeni Firebase Storage kovaları artık ücretli Blaze planı gerektiriyor ve bütçe sıfır. Bu yüzden Storage'ı varsayılan kabul etme. Alternatifler: görsel URL'si girmek, `public/` klasörü, ücretsiz bir görsel servisi.
- Şık sayısı başta 4 kabul edilebilir ama modeli sabit 4'e kilitleme.

## 5. Güvenlik kuralları

- `pools`, `questions`, `settings`: **herkes okuyabilir**, yalnızca admin yazabilir. Admin = `admins/{uid}` belgesi olan giriş yapmış kullanıcı. Kurallar yazılan verinin şeklini de doğrular.
- `admins`: kullanıcı yalnızca kendi belgesini okuyabilir; uygulamadan yazılamaz.
- Kurallar Firebase CLI ile yayınlanır: `npx firebase-tools deploy --only firestore:rules` (proje `.firebaserc` içinde).
- Doğru cevabın istemciden görülebilmesi sorun değil (tek bilgisayar, sınav değil, eğlenceli sınıf aktivitesi).
- Firebase yapılandırma değerleri `.env.local` içinde (`NEXT_PUBLIC_FIREBASE_*`). `.env.local` asla commit edilmez. `.env.example` tutulur.
- `firestore.rules` dosyası repoda tutulur.

## 6. Arayüz ve tasarım ilkeleri

- Uygulamanın mantığı basit, **arayüz kalitesi projenin asıl değeri.** Sıradan/şablon görünümden kaçın.
- Bilgi yarışması atmosferi hedeflenir: dramatik ışık, koyu tema, parlak vurgular, gerilim. Ancak **TV programının logosu, müziği, ses efektleri veya birebir görsel tasarımı kullanılmaz.** Tasarım ve sesler özgün ya da açık lisanslı olmalı.
- Ses dosyaları telifsiz/uygun lisanslı kaynaklardan alınmalı ya da Web Audio ile üretilmeli. Kaynağını `public/sounds/CREDITS.md` dosyasına yaz.
- **Renk temaları:** Gece (koyu, varsayılan, projeksiyon için), Gündüz (açık), Neon (canlı mor/pembe/turkuaz). Kurulum ekranı, yarışma üst çubuğu (`T` kısayolu) ve admin panelinden değiştirilir; seçim bilgisayar başına hatırlanır. Renkler yalnızca `src/app/globals.css` içindeki token'lardan gelir, bileşenlerde sabit renk kullanma.
- Arayüz dili **Türkçe.** Kod, değişken ve commit mesajları İngilizce olabilir.
- Admin paneli yarışma ekranından sade olabilir ama teknik olmayan biri için anlaşılır olmalı.
- Erişilebilirlik: renk tek başına anlam taşımasın, doğru/yanlış ayrıca ikon/metinle de belirtilsin (projeksiyonda renkler soluk görünebilir).

## 7. Çalışma şekli

- Ortam: Windows 11. Komutları PowerShell uyumlu ver.
- Küçük, mantıklı adımlarla ilerle. Her büyük adımdan sonra neyin çalıştığını ve nasıl deneyeceğimi kısaca söyle.
- Git kullanılıyor (GitHub: `YerdemA`). Anlamlı noktalarda commit öner.
- Önerilen sıra:
  1. Proje iskeleti (Next.js + TS + Tailwind), klasör yapısı, Firebase bağlantısı
  2. Veri modeli ve Firestore kuralları
  3. Admin paneli (giriş, havuz CRUD, soru CRUD, ayarlar)
  4. Yarışma kurulum ekranı
  5. Yarışma ekranı: önce işlevsel, sonra animasyon ve ses cilası
  6. Vercel'e yayın ve test verisi

## 8. AÇIK NOKTALAR (sırası gelince bana sor)

- [x] Bir yarışmada kaç soru sorulacak? Varsayılan ve üst sınır. → Varsayılan 15, üst sınır 40 (`src/lib/quizConfig.ts`).
- [x] Puanlama olacak mı? → Evet. Toplam puan (varsayılan 100, kurulum ekranında değiştirilebilir) soru sayısına eşit bölünür. Soru başı puan ondalıklı gösterilir (6,67), toplam puan tam sayıya yuvarlanır (hepsini bilen tam puanı alır).
- [x] Takım modu olacak mı? → Şimdilik hayır (tek skor). Sonra eklenebilir; kodu buna kapalı yazma.
- [x] Joker hakları olacak mı? → Evet, üç joker, her biri yarışma başına 1 kez, kurulum ekranında açılıp kapatılabilir:
  - **Yarı yarıya:** doğru cevapla birlikte yalnızca bir yanlış şık kalır (4 şıkta iki yanlış elenir; en az 3 şıklı sorularda).
  - **Süre ekleme:** +30 sn (yalnızca süre sınırı açıkken).
  - **Çift cevap:** soruyu cevaplamadan önce açılır; ilk tahmin yanlışsa ikinci tahmin hakkı. İkinci tahmin doğruysa **yarım puan**.
- [x] Şıklar karıştırılsın mı? → Hayır, girildiği sırayla gösterilir (Doğru/Yanlış ve "Hepsi" gibi şıklar bozulmasın diye). Soruların sırası rastgeledir.
- [x] Yanlış cevapta yarışma bitiyor mu, devam mı ediyor? → Devam ediyor. Yanlış cevap 0 puan, eksi puan yok.
- [x] Süre dolunca ne olacak? → Yanlış sayılır (0 puan), doğru cevap gösterilir, sonraki soruya Enter/boşluk ile geçilir.
- [x] Doğru cevaptan sonra açıklama/bilgi notu gösterilecek mi? → Evet, isteğe bağlı `explanation` alanı. *(Ekranda nasıl gösterileceği yarışma ekranında kararlaştırılacak.)*
- [x] Sorular bize hangi formatta gelecek? Toplu içe aktarma gerekli mi? → Excel (.xlsx) içe aktarma var. Şablon: `public/sablon/soru-sablonu.xlsx`, sütunlar: Soru, A–F, Doğru Cevap (harf), Açıklama. Sorular paneldeki açık havuza eklenir; aynı metinli sorular atlanır. Okuma: `read-excel-file/universal`, mantık: `src/lib/importQuestions.ts`.
- [ ] Görseller nerede barındırılacak? (Bkz. bölüm 4.)
- [ ] Uygulamanın son adı ve logosu.
- [ ] Vercel alan adı (`*.vercel.app` alt alan adı).

Bu noktalardan biri karara bağlandığında bu dosyayı güncelle ve maddeyi işaretle.
