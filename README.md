# MetinAnaliz

MetinAnaliz, Spring Boot ile gelistirilmis bir metin analiz uygulamasidir. Uygulama metin icin kelime sayisi, karakter sayisi, cumle sayisi ve en sik gecen kelime bilgisini uretir. Ayrica oturum tabanli kullanici girisi, plan yonetimi ve premium kullanicilar icin dosya analizi destegi sunar.

## Ozellikler

- Duz metin analizi
- `.txt`, `.pdf` ve `.docx` dosyalarindan metin cikarimi
- `FREE`, `PRO` ve `PREMIUM` plan yapisi
- Oturum bazli giris ve kayit islemleri
- H2 veritabani ve H2 Console destegi
- Docker ve Docker Compose ile calistirma

## Teknolojiler

- Java 21
- Spring Boot
- Spring Web
- Spring Security
- Spring Data JPA
- H2 Database
- Apache PDFBox
- Apache POI
- Maven
- Docker

## Plan Limitleri

- `FREE`: en fazla 600 karakter
- `PRO`: en fazla 4000 karakter
- `PREMIUM`: en fazla 8000 karakter

Not: Dosya yukleme ve dosyadan analiz ozelligi sadece `PREMIUM` planinda aciktir.

## Varsayilan Demo Kullanici

Uygulama ilk calistiginda asagidaki premium kullanici otomatik olusturulur:

- E-posta: `member@example.com`
- Sifre: `text123`
- Plan: `PREMIUM`

## Uygulamayi Calistirma

### Maven ile

```bash
cd backend
mvn spring-boot:run
```

Uygulama su adreste calisir:

```text
http://localhost:8081
```

### Paketleme

```bash
cd backend
mvn clean package
```

### Docker Compose ile

```bash
docker compose up --build
```

## Veritabani ve H2 Console

- H2 Console: `http://localhost:8081/h2-console`
- JDBC URL: `jdbc:h2:file:./data/textanalyzerdb`
- Proje yapisinda veritabani dosyasi `backend/data/` altinda tutulur.
- Kullanici adi: `sa`
- Sifre: bos

## API Uclari

Tum API yollarinin kok adresi:

```text
http://localhost:8081/api
```

### Test

```bash
curl http://localhost:8081/api/test
```

Beklenen cevap:

```text
API calisiyor
```

### Metin Analizi

```bash
curl -X POST http://localhost:8081/api/analyze \
  -H "Content-Type: text/plain" \
  --data "Merhaba dunya. Merhaba Spring Boot!"
```

Ornek cevap:

```json
{
  "wordCount": 5,
  "characterCount": 37,
  "sentenceCount": 2,
  "mostFrequentWord": "merhaba"
}
```

### Legacy Metin Analizi

```bash
curl -X POST http://localhost:8081/api/legacy/analyze \
  -H "Content-Type: text/plain" \
  --data "Eski endpoint uyumlulugu icin ornek metin."
```

## Kimlik Dogrulama Uclari

Kimlik dogrulama yollarinin kok adresi:

```text
http://localhost:8081/api/auth
```

### Kayit Ol

`FREE` plan icin:

```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"username\":\"demo\",\"email\":\"demo@example.com\",\"password\":\"123456\",\"planType\":\"FREE\"}"
```

Ucretli planlar icin `paymentDetails` alani da gonderilmelidir.

### Giris Yap

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"email\":\"member@example.com\",\"password\":\"text123\"}"
```

### Oturum Durumu

```bash
curl http://localhost:8081/api/auth/status \
  -b cookies.txt
```

### Plani Yukselt

```bash
curl -X POST http://localhost:8081/api/auth/upgrade \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"planType\":\"PREMIUM\",\"paymentDetails\":{\"cardHolderName\":\"Demo User\",\"cardNumber\":\"4242424242424242\",\"expiryMonth\":\"12\",\"expiryYear\":\"29\",\"cvv\":\"123\",\"acceptedTerms\":true}}"
```

### Ucretli Plani Iptal Et

```bash
curl -X POST http://localhost:8081/api/auth/cancel-plan \
  -b cookies.txt
```

### Cikis Yap

```bash
curl -X POST http://localhost:8081/api/auth/logout \
  -b cookies.txt
```

## Dosya Analizi

Bu endpoint sadece `PREMIUM` kullanicilar icin calisir. Desteklenen uzantilar:

- `txt`
- `pdf`
- `docx`

Ornek kullanim:

```bash
curl -X POST http://localhost:8081/api/analyze-file \
  -b cookies.txt \
  -F "file=@ornek.pdf"
```

## Notlar

- Uygulama oturum bilgisini `HttpSession` ile tutar.
- Dosya yukleme yetkisi sadece `PREMIUM` planda vardir.
- `PRO` plani daha yuksek karakter limiti saglar ancak dosya yukleme acmaz.
