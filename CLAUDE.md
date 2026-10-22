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
| Ses | **Howler.js** veya HTMLAudioElement | Ses efektleri. Önceden yükleme (preload) şart. |
| Veritabanı | **Firebase Firestore** (Spark / ücretsiz plan) | Sunucu yönetimi yok, ücretsiz kota bu ölçek için fazlasıyla yeterli. |
| Kimlik doğrulama | **Firebase Auth (e-posta/şifre)** | Sadece admin paneli için. |
| Yayın | **Vercel** (Hobby / ücretsiz) | Linkle paylaşım. |

Yeni bir kütüphane eklemeden önce gerekçesini söyle. Küçük ve yaygın yardımcı paketlerde sorman gerekmez.

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
  options: string[]              // şık metinleri
  correctIndex: number
  createdAt: Timestamp
  updatedAt: Timestamp

settings/app
  defaultTimeLimitSec: number
```

- **Görsel desteği:** Altyapı görsele hazır kurulacak (`imageUrl` alanı ve arayüzde görsel alanı için yer). Sorular şimdilik metin olacak. Görsellerin *nerede barındırılacağı* henüz karar verilmedi *(AÇIK NOKTA)*. Not: yeni Firebase Storage kovaları artık ücretli Blaze planı gerektiriyor ve bütçe sıfır. Bu yüzden Storage'ı varsayılan kabul etme. Alternatifler: görsel URL'si girmek, `public/` klasörü, ücretsiz bir görsel servisi.
- Şık sayısı başta 4 kabul edilebilir ama modeli sabit 4'e kilitleme.

## 5. Güvenlik kuralları

- `pools`, `questions`, `settings`: **herkes okuyabilir**, yalnızca giriş yapmış admin yazabilir.
- Doğru cevabın istemciden görülebilmesi sorun değil (tek bilgisayar, sınav değil, eğlenceli sınıf aktivitesi).
- Firebase yapılandırma değerleri `.env.local` içinde (`NEXT_PUBLIC_FIREBASE_*`). `.env.local` asla commit edilmez. `.env.example` tutulur.
- `firestore.rules` dosyası repoda tutulur.

## 6. Arayüz ve tasarım ilkeleri

- Uygulamanın mantığı basit, **arayüz kalitesi projenin asıl değeri.** Sıradan/şablon görünümden kaçın.
- Bilgi yarışması atmosferi hedeflenir: dramatik ışık, koyu tema, parlak vurgular, gerilim. Ancak **TV programının logosu, müziği, ses efektleri veya birebir görsel tasarımı kullanılmaz.** Tasarım ve sesler özgün ya da açık lisanslı olmalı.
- Ses dosyaları telifsiz/uygun lisanslı kaynaklardan alınmalı ya da Web Audio ile üretilmeli. Kaynağını `public/sounds/CREDITS.md` dosyasına yaz.
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

- [ ] Bir yarışmada kaç soru sorulacak? Varsayılan ve üst sınır.
- [ ] Puanlama olacak mı? (Ör. sadece doğru sayısı mı, yoksa ödül basamakları/puan tablosu mu?)
- [ ] Takım modu olacak mı? (Sınıf gruplara ayrılıp sırayla mı yarışacak?)
- [ ] Joker hakları (yarı yarıya vb.) olacak mı?
- [ ] Yanlış cevapta yarışma bitiyor mu, devam mı ediyor?
- [ ] Süre dolunca ne olacak? (Yanlış sayılsın mı, doğru cevap gösterilip geçilsin mi?)
- [ ] Doğru cevaptan sonra açıklama/bilgi notu gösterilecek mi? (Eğitim amaçlı faydalı olabilir.)
- [ ] Sorular bize hangi formatta gelecek? Toplu içe aktarma gerekli mi?
- [ ] Görseller nerede barındırılacak? (Bkz. bölüm 4.)
- [ ] Uygulamanın son adı ve logosu.
- [ ] Vercel alan adı (`*.vercel.app` alt alan adı).

Bu noktalardan biri karara bağlandığında bu dosyayı güncelle ve maddeyi işaretle.
