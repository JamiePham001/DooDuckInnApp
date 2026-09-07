# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DooDuckInnApp is a business mobile application intended to help the their father become self-sufficient in:

- writing quarterly GST (Goods and Services Tax) reports
- ordering stock from suppliers via email

Making use of AI Workflows:

- image and form processing
- produce report documents
- quarter summary
- automate emails

## General

- Never push with my explicit permission

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

Relationships:
- USER has SUPPLIER (one-to-many)
- SUPPLIER supplies ITEM (one-to-many)
- USER has GST (one-to-many)
- GST records SALES (one-to-many)
- GST records PURCHASE (one-to-many)
- SUPPLIER supplies PURCHASE (one-to-many, optional)
- ITEM appears in PURCHASE (one-to-many, optional)
