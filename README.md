# About

A business mobile application striving to help my dad become self sufficient in writing his own GST reports and simplifying ordering stock from suppliers via email. Creating a personalised experience that focuses on intuitive navigation and UI using his native Vietnamese language. The app will make use of Claude AI workflows to scan invoices, and automate producing documents and emails.

## Tech Stack

- Frontend: React Native
- Backend Runtime: ASP.NET Core (.NET)
- Compute / Hosting: AWS Lambda + AWS API Gateway
- Database: Neon PostgreSQL
- ORM / Data Layer: Entity Framework Core
- Auth: AWS Cognito
- File / Blob Storage: AWS S3
- Monitoring / APM: AWS CloudWatch
- Transactional Email: AWS SES
- AI / LLM: Anthropic Claude
- Search: Postgres FTS
- CI / CD: GitHub Actions

## What I Learned
- Clean Architecture
- Fluent API
  - Configuring models

## What I Can Improve On

## Relational Model

```
USER
  user_id       (PK, NOT_NULL, Integer)
  cognito_sub   (NOT_NULL, UNIQUE, Varchar(150))
  email         (NOT_NULL, UNIQUE, Varchar(150))
  phone         (NULL, Varchar(20))
  abn           (NOT_NULL, Varchar(11))

SUPPLIER
  supplier_id   (PK, NOT_NULL, Integer)
  user_id       (FK, NOT_NULL, Integer)
  supplier_name (NOT_NULL, Varchar(150))
  email         (NOT_NULL, Varchar(150))
  phone         (NULL, Varchar(20))
  address       (NULL, Varchar(255))

ITEM
  item_id       (PK, NOT_NULL, Integer)
  supplier_id   (FK, NOT_NULL, Integer)
  name          (NOT_NULL, Varchar(150))
  qty           (NULL, Integer)
  unit_price    (NULL, Decimal(10,2))
  unit          (NULL, Varchar(20))

GST
  gst_id        (PK, NOT_NULL, Integer)
  user_id       (FK, NOT_NULL, Integer)
  start_date    (NOT_NULL, Date)
  end_date      (NOT_NULL, Date)
  status        (NULL, Varchar(30))

SALES
  sales_id      (PK, NOT_NULL, Integer)
  gst_id        (FK, NOT_NULL, Integer)
  name          (NOT_NULL, Varchar(100))
  amount        (NOT_NULL, Decimal(12,2))
  gst           (NOT_NULL, Decimal(12,2), DEFAULT 0)
  is_verified   (NOT_NULL, Boolean, DEFAULT false)

PURCHASE
  purchase_id   (PK, NOT_NULL, Integer)
  gst_id        (FK, NOT_NULL, Integer)
  supplier_id   (FK, NULL, Integer)
  item_id       (FK, NULL, Integer)
  name          (NOT_NULL, Varchar(100))
  amount        (NOT_NULL, Decimal(12,2))
  gst           (NOT_NULL, Decimal(12,2), DEFAULT 0)
  is_verified   (NOT_NULL, Boolean, DEFAULT false)
```
