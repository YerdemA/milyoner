# Geliştirici rehberi

Bu belge projenin teknoloji yığınını, geliştirme ortamının kurulumunu ve kodun nasıl düzenlendiğini anlatır.
Uygulamanın ne olduğu ve nasıl kullanıldığı için ana [README](../README.md) dosyasına bakın.
Proje kararları ve kuralları [`CLAUDE.md`](../CLAUDE.md) içinde.

## Teknoloji yığını

| Katman | Seçim | Neden |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, Cache Components) + **TypeScript** | Vercel ile sorunsuz yayın, tip güvenliği. |
| Arayüz | **React 19** | Next.js ile birlikte gelir. |
| Stil | **Tailwind CSS 4** | Renkler `src/app/globals.css` içindeki token'lardan gelir, temalar bu token'ları değiştirir. |
| Animasyon | **Framer Motion 14** | Doğru/yanlış efektleri, geçişler, konfeti. |
| Ses | **Web Audio API** (`src/lib/sound.ts`) | Bütün sesler kodla üretilir; ses dosyası, lisans derdi ve önceden yükleme yok. |
| Veritabanı | **Firebase Firestore** (Spark, ücretsiz) | Sunucu yönetimi yok; bu ölçek için ücretsiz kota yeterli. |
| Giriş | **Firebase Auth** (e-posta/şifre) | Yalnızca yönetim paneli için. |
| Excel | **read-excel-file** / **write-excel-file** | Soruları içe ve dışa aktarma. İkisi de yalnızca ihtiyaç anında yüklenir. |
| Çevrimdışı | Firestore IndexedDB önbelleği + `public/sw.js` | İnternet kesilince yarışma devam eder. Ek kütüphane yok. |
| Yayın | **Vercel** (Hobby, ücretsiz) | Linkle paylaşım. |

**Bütçe sıfırdır:** yalnızca ücretsiz katmanlar kullanılır, kart bilgisi isteyen hiçbir servis eklenmez.
Bu yüzden Firebase Storage kullanılmıyor; yeni Storage kovaları ücretli Blaze planı gerektiriyor.

## Geliştirme ortamı

| Araç | Sürüm | Not |
|---|---|---|
| İşletim sistemi | Windows 11 | Komutlar PowerShell için yazılmıştır. |
| Node.js | 20 veya üstü | Proje Node 24 ile geliştirildi. |
| npm | 10 veya üstü | Node ile birlikte gelir. |
| Git | herhangi | GitHub: `YerdemA/milyoner` |
| Tarayıcı | Chrome veya Edge | Tam ekran ve ses için güncel bir tarayıcı. |
| Firebase CLI | `npx firebase-tools` | Kurulum gerekmez; yalnızca güvenlik kurallarını yayınlamak için. |

Editör olarak VS Code önerilir. ESLint ve Tailwind CSS IntelliSense eklentileri işe yarar.

### İlk kurulum

```powershell
git clone https://github.com/YerdemA/milyoner.git
cd milyoner
npm install
Copy-Item .env.example .env.local   # sonra değerleri doldurun
npm run dev                          # http://localhost:3000
```

`.env.local` içindeki `NEXT_PUBLIC_FIREBASE_*` değerleri şuradan alınır:
Firebase konsolu → Proje ayarları → Genel → Uygulamalarınız → SDK yapılandırması.
**`.env.local` asla commit edilmez**; `.env.example` boş şablon olarak repoda tutulur.

### Firebase projesini sıfırdan hazırlamak

Mevcut proje: `milyoner-bd359`. Yeni bir proje gerekirse:

1. [Firebase konsolunda](https://console.firebase.google.com) proje oluşturun (Spark planı yeterli).
2. **Authentication** → Sign-in method → **E-posta/Şifre**'yi açın.
3. **Firestore Database** oluşturun.
4. Projeye bir **web uygulaması** ekleyin ve yapılandırma değerlerini `.env.local`'a yazın.
5. **Yönetici ekleyin:**
   - Authentication → Users → kullanıcı ekleyin ve oluşan **UID**'yi kopyalayın.
   - Firestore'da `admins` koleksiyonunda belge kimliği o UID olan bir belge oluşturun, örneğin `name: "Ad"` alanıyla.
   - Uygulamada kayıt ekranı yoktur; yöneticiler yalnızca bu yolla eklenir.
6. `.firebaserc` dosyasındaki proje kimliğini güncelleyin ve güvenlik kurallarını yayınlayın:

   ```powershell
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --non-interactive
   ```

### Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (http://localhost:3000). Service worker burada **kapalıdır**. |
| `npm run build` | Üretim derlemesi. Tip hataları da burada yakalanır. |
| `npm run start` | Derlenmiş uygulamayı çalıştırır. Çevrimdışı mod yalnızca burada denenebilir. |
| `npm run lint` | ESLint kontrolü. |
| `npx tsc --noEmit` | Yalnızca tip kontrolü. |

Otomatik test paketi yoktur. Her değişiklikten sonra `npm run lint` ve `npm run build` çalıştırılır, ekranlar elle denenir.

## Mimari

```
Firestore (pools, questions, settings, admins)
   │  herkes okur, yalnızca admin yazar (firestore.rules)
   ▼
Kurulum ekranı  ──buildQuiz()──▶  Quiz (sessionStorage)  ──▶  Yarışma ekranı
   /                                                          /yarisma
                                                               │ quizReducer (saf fonksiyon)
                                                               ▼
                                                         Özet ekranı
```

- **Yarışma tamamen tarayıcıda yaşar.** Kurulum ekranı soruları Firestore'dan çeker, karıştırır ve
  `sessionStorage`'a yazar. Yarışma sırasında ağ gerekmez; sayfa yenilense bile kaldığı yerden devam eder
  (ilerleme ve geri sayım da saklanır).
- **Oyun mantığı** `src/lib/quizEngine.ts` içindeki saf bir reducer'dır: aşamalar `asking → locked → revealed → finished`,
  jokerler, puan. Arayüzden bağımsız olduğu için kolayca denenebilir.
- **Doğru cevabın istemcide görülebilmesi** bilinçli bir karardır: tek bilgisayar, sınav değil, eğlenceli sınıf etkinliği.
- **Çevrimdışı çalışma** iki katmanlıdır:
  - Firestore okumaları IndexedDB'de saklanır (`src/lib/firebase.ts`). Kurulum ekranı açılınca bütün sorular
    oturum başına bir kez önbelleğe alınır (`src/lib/firestore/offline.ts`).
  - `public/sw.js` sayfaları ve dosyaları saklar. Sayfalar için önce ağ denenir, ağ yoksa kayıtlı kopya kullanılır.
    `/_next/static` dosyaları adlarında içerik özeti taşıdığı için doğrudan önbellekten gelir.
    Bu yüzden yeni bir yayın, internet varken her zaman hemen görünür.
- **Temalar** `<html data-theme="...">` ile seçilir. `<head>` içindeki küçük bir betik kayıtlı temayı ilk
  boyamadan önce uygular, böylece sayfa açılırken yanlış renk görünmez.

### Tarayıcıda saklanan veriler

| Anahtar | Yer | İçerik |
|---|---|---|
| `bilgi-yarismasi.quiz` | sessionStorage | Hazırlanan yarışma (sorular ve ayarlar) |
| `bilgi-yarismasi.progress` | sessionStorage | Yarışmanın ilerleyişi |
| `bilgi-yarismasi.timer` | sessionStorage | Mevcut sorunun geçen süresi |
| `bilgi-yarismasi.offline-warmed` | sessionStorage | Soruların bu oturumda önbelleğe alındığı |
| `bilgi-yarismasi.last-config` | localStorage | Son kurulum seçimleri |
| `bilgi-yarismasi.theme` | localStorage | Renk teması |
| `bilgi-yarismasi.muted` | localStorage | Ses kapalı mı |
| `bilgi-yarismasi.text-scale` | localStorage | Yarışma ekranı yazı boyutu |

## Klasör yapısı

```
src/
  app/                      sayfalar (App Router)
    page.tsx                /            kurulum ekranı
    yarisma/                /yarisma     yarışma ekranı ve özet
    admin/giris/            /admin/giris yönetici girişi
    admin/(panel)/          /admin, /admin/ayarlar, /admin/havuzlar/[poolId]
    globals.css             renk token'ları ve temalar
  components/
    ui/                     ortak bileşenler (Button, Modal, Switch, ThemeSwitcher…)
    quiz/                   kurulum, yarışma, özet, efektler
    admin/                  yönetim paneli
  hooks/                    useTheme, useSoundMuted, useQuizScale, useOnline…
  lib/
    firebase.ts             Firebase bağlantısı ve çevrimdışı önbellek
    firestore/              Firestore okuma/yazma fonksiyonları
    validation.ts           limitler ve doğrulama (firestore.rules ile senkron)
    quiz.ts                 yarışma oluşturma ve tarayıcıda saklama
    quizEngine.ts           oyun mantığı (reducer)
    quizConfig.ts           soru sayısı, puan, süre sabitleri
    sound.ts                Web Audio ses efektleri
    theme.ts, quizScale.ts  tema ve yazı boyutu tercihleri
    importQuestions.ts      Excel'den içe aktarma
    exportQuestions.ts      Excel'e dışa aktarma
  types/                    ortak TypeScript tipleri
public/
  sablon/soru-sablonu.xlsx  içe aktarma şablonu
  sounds/CREDITS.md         seslerin kaynağı
  sw.js                     service worker (çevrimdışı)
firestore.rules             güvenlik kuralları (repoda tutulur)
```

## Kurallar ve alışkanlıklar

- **Arayüz dili Türkçe**; kod, değişken adları ve commit mesajları İngilizce.
- **Renkler yalnızca token'lardan gelir** (`bg-bg`, `text-fg`, `bg-accent`, `text-success`…). Bileşenlere sabit renk
  yazılmaz, aksi halde temalar bozulur. Yeni bir tema `globals.css`'e bir `[data-theme="..."]` bloğu ve
  `src/lib/theme.ts`'e bir satır eklemekle olur.
- **Renk tek başına anlam taşımaz:** doğru/yanlış her zaman ikon ve metinle de belirtilir (projeksiyonda renkler soluk görünebilir).
- **Limitler iki yerde durur:** `src/lib/validation.ts` ve `firestore.rules`. Biri değişirse diğeri de değişmeli ve kurallar yeniden yayınlanmalı.
- **Yeni kütüphane eklemeden önce gerekçe yazılır.**
- **Sesler ve tasarım özgündür.** TV programının logosu, müziği veya efektleri kullanılmaz.

## Next.js 16'ya özgü notlar

Bu sürüm eski Next.js'ten farklı davranır. Belgeler `node_modules/next/dist/docs/` altında.

- **Cache Components açık:** dinamik `params` ve `usePathname` bir `<Suspense>` içinde okunmalı.
- **Yönetim paneli sayfaları** `export const instant = false` tanımlar, çünkü giriş kontrolü tarayıcıda yapılır.
- **Sayfa taşıdıktan sonra tip hatası** veya **CSS değişikliği derlemeye yansımazsa** `.next` klasörünü silip yeniden derleyin:

  ```powershell
  Remove-Item -Recurse -Force .next
  ```

## Yayın (Vercel)

Canlı adres: **https://nabiz-yarisma.vercel.app** (Vercel projesi `yerdems-projects/nabiz`, Hobby planı).

- Proje GitHub reposuna bağlıdır: **`main` dalına her gönderim otomatik yayınlanır.** Elle yayın: `npx vercel deploy --prod`.
- Ortam değişkenleri: `.env.local`'daki altı `NEXT_PUBLIC_FIREBASE_*` değeri Vercel'de Production ve Development ortamlarına girilidir.
  Değer değişirse Vercel → Settings → Environment Variables'dan güncellenir ve yeniden yayınlanır.
- Firebase konsolu → Authentication → Settings → **Authorized domains** listesinde `nabiz-yarisma.vercel.app` bulunmalıdır,
  yoksa yönetici girişi çalışmaz. Adres değişirse yenisi de eklenir.
- Bazı ağlardaki filtreler (ör. internet sağlayıcısının "Güvenli İnternet" profili) `*.vercel.app` adreslerini engelleyebilir.
  Site açılmazsa önce başka bir ağdan (ör. telefonun mobil verisi) denenmelidir.
