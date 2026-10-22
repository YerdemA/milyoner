# Ses kaynakları

Uygulamadaki tüm ses efektleri **kod içinde Web Audio API ile sentezlenir**
(`src/lib/sound.ts`). Hiçbir hazır ses dosyası, müzik veya üçüncü taraf ses kaydı kullanılmaz;
bu yüzden lisans veya atıf gerekmez.

| Ses | Nerede | Nasıl üretilir |
|---|---|---|
| Yeni soru | Soru ekrana gelince | Bant geçiren filtreli gürültü süpürmesi + sinüs çan |
| Kilitleme | Şık seçilince | Hızla düşen sinüs ("güm") + kısa kare dalga tık |
| Gerilim | Cevap açıklanmadan önce | Üç testere dişi osilatör, açılan alçak geçiren filtre, hızlanan tremolo |
| Doğru | Doğru cevapta | Do majör arpej + akor (üçgen/sinüs) + yüksek frekanslı pırıltı |
| Yanlış | Yanlış cevapta | İki inen testere dişi nota + alt oktav sinüs |
| İkinci şans | Çift cevap jokerinde ilk tahmin yanlışsa | Kısa alçak nota + yükselen üçgen dalga |
| Süre doldu | Süre bitince | İnen üç kare dalga bip + alçak nota |
| Tik | Son 5 saniye | Kısa üçgen dalga |
| Joker | Joker kullanılınca | Hızlı yükselen sinüs notaları + pırıltı |
| Final | Sonuç ekranı | Testere dişi "bakır" akor dizisi (puan düşükse kısa sürüm) |

Sesler ileride dosyayla değiştirilecekse, yalnızca açık lisanslı (ör. CC0) kaynaklar kullanılmalı
ve kaynağı bu tabloya eklenmelidir.
