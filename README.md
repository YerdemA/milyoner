# Bilgi Yarışması (geçici ad)

Hemşirelik dersinde kullanılmak üzere hazırlanan **sınıf içi çoktan seçmeli bilgi yarışması**.

- Tek bir bilgisayardan açılır ve projeksiyonla tahtaya yansıtılır.
- Öğrenciler cevabı sözlü verir; sunucu (öğretim üyesi ya da bir öğrenci) seçilen şıkkı bilgisayardan işaretler.
- Öğrencilerin kendi cihazlarından bağlanması, hesap açması veya bir şey yüklemesi gerekmez.

> Teknoloji yığını, geliştirme ortamının kurulumu ve kodun yapısı için: **[Geliştirici rehberi](./docs/README.md)**
> Proje kararları ve açık noktalar için: [`CLAUDE.md`](./CLAUDE.md)

## Özellikler

### Yarışma kurulumu
- Bir veya birden çok **soru havuzu** seçilir; sorular rastgele ve tekrarsız çekilir.
- **Soru sayısı** (varsayılan 15, en fazla 40) ve **toplam puan** (varsayılan 100) ayarlanır. Puan sorulara eşit bölünür.
- İsteğe bağlı **süre sınırı**. Süre dolarsa soru yanlış sayılır ve doğru cevap gösterilir.
- Üç **joker**, her biri yarışmada bir kez kullanılır ve kurulumda açılıp kapatılabilir:
  - **Yarı yarıya:** iki yanlış şık elenir.
  - **+30 sn:** süreye 30 saniye eklenir.
  - **Çift cevap:** ilk tahmin yanlışsa ikinci hak verilir; ikinci tahminde doğru cevap yarım puan getirir.
- Son seçimler bilgisayarda hatırlanır.

### Yarışma ekranı
- Uzak sıralardan okunacak büyüklükte, projeksiyona göre tasarlanmış ekran ve **tam ekran** modu.
- Cevap seçilince kısa bir **gerilim anı**, ardından doğru/yanlış açıklaması ve varsa **bilgi notu**.
- Doğru ve yanlış için **animasyonlar** (konfeti, ışık, sarsılma) ve kodla üretilmiş özgün **ses efektleri**.
- Görsel **geri sayım**, son 5 saniyede tik sesi.
- **Duraklatma:** soru açıklanırken süre durdurulabilir.
- **Yazı boyutu** büyütülüp küçültülebilir (salonun büyüklüğüne göre).
- Sayfa yanlışlıkla yenilenirse yarışma **kaldığı yerden** devam eder; süre de kaldığı saniyeden sürer.
- **Özet ekranı:** puan, doğru/yanlış sayıları, soru soru sonuçlar.
  - Aynı ayarlarla yeni yarışma başlatılabilir.
  - **Bilinemeyen sorular** tekrar sorulabilir (tekrar turu).

### Görünüm
- Üç renk teması: **Gece** (koyu, projeksiyon için önerilir), **Gündüz** (açık) ve **Neon** (canlı mor/pembe/turkuaz).
- Doğru/yanlış renkle birlikte her zaman ikon ve yazıyla da gösterilir; projeksiyonda soluk görünen renkler sorun olmaz.
- İşletim sisteminde "animasyonları azalt" açıksa hareketler sadeleşir.

### İnternet kesilirse
- Uygulama bir kez açıldıktan sonra **internetsiz de çalışır**.
- Başlamış bir yarışma hiç etkilenmez.
- Kurulum ekranı, bu bilgisayarda daha önce açılmış sorularla yeni yarışma başlatabilir.
- İnternet yokken ekranda uyarı görünür. Yönetim panelindeki değişiklikler ise ancak bağlantı gelince kaydedilir.

### Yönetim paneli
- E-posta ve şifreyle korunur. Kayıt ekranı yoktur; yöneticiler Firebase konsolundan eklenir.
- **Soru havuzları:** oluşturma, adını değiştirme, silme (içindeki soruların da silineceği açıkça belirtilir).
- **Sorular:** ekleme, düzenleme, silme, arama. Her soruda 2–6 şık ve isteğe bağlı bilgi notu bulunabilir.
- **Excel'den içe aktarma:** hazır şablon indirilir, doldurulur ve yüklenir. Hatalı satırlar yüklemeden önce gösterilir, aynı metinli sorular atlanır.
- **Excel'e dışa aktarma:** havuzdaki sorular şablonla aynı biçimde indirilir. Yedek olarak saklanabilir veya başka bir havuza tekrar yüklenebilir.
- **Ayarlar:** varsayılan süre sınırı.

## Kullanım

### Yarışma başlatmak
1. Ana sayfayı açın, soru havuzlarını seçin ve ayarları yapın.
2. **Yarışmayı başlat**'a basın ve projeksiyonda **Tam ekran** butonunu kullanın.
3. Sınıfın cevabını şıkka tıklayarak ya da harf tuşuyla işaretleyin.

### Klavye kısayolları (yarışma ekranı)

| Tuş | İşlev |
|---|---|
| `A`–`F` veya `1`–`6` | Şık seç |
| `Enter` / `Boşluk` | Sonraki soru |
| `Esc` | Gerilim anında seçimden vazgeç |
| `P` | Duraklat / devam et (süre sınırı açıkken) |
| `+` / `-` | Yazıyı büyüt / küçült |
| `M` | Sesi aç / kapat |
| `T` | Temayı değiştir |

### Soru eklemek
1. **Yönetim paneli** bağlantısından (ana sayfanın altında) giriş yapın.
2. Bir havuz oluşturun ve içine girin.
3. Soruları tek tek ekleyin ya da **Excel'den içe aktar** ile şablonu doldurup yükleyin.

## Sayfalar

| Adres | İçerik |
|---|---|
| `/` | Yarışma kurulumu |
| `/yarisma` | Yarışma ekranı ve özet |
| `/admin/giris` | Yönetici girişi |
| `/admin` | Soru havuzları |
| `/admin/havuzlar/[poolId]` | Havuzdaki sorular |
| `/admin/ayarlar` | Ayarlar |

## Yol haritası

- [x] 1. Proje iskeleti ve Firebase bağlantısı
- [x] 2. Veri modeli ve Firestore güvenlik kuralları
- [x] 3. Yönetim paneli (Excel içe/dışa aktarma dahil)
- [x] 4. Yarışma kurulum ekranı
- [x] 5. Yarışma ekranı, animasyonlar, sesler, temalar, çevrimdışı çalışma
- [ ] 6. Vercel'e yayın
- [ ] Görsel desteği, uygulamanın son adı ve logosu (açık noktalar)

## Lisans ve içerik

Tasarım ve sesler bu proje için özgün olarak hazırlanmıştır; hiçbir TV programının logosu, müziği veya efekti kullanılmaz.
Seslerin nasıl üretildiği [`public/sounds/CREDITS.md`](./public/sounds/CREDITS.md) dosyasında anlatılır.
