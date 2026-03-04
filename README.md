# Bitespeed Backend Task – Identity Reconciliation

This project implements the **Identity Reconciliation API** for the Bitespeed backend assignment.

The goal is to identify and link multiple contacts belonging to the same customer based on shared **email addresses** or **phone numbers**.

---

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- Thunder Client / Postman for testing

---

## Database Schema

The system uses a `Contact` table with the following structure:

| Field | Type | Description |
|------|------|-------------|
| id | Integer | Unique identifier |
| phoneNumber | String | Customer phone number |
| email | String | Customer email |
| linkedId | Integer | ID of the primary contact |
| linkPrecedence | Enum | `primary` or `secondary` |
| createdAt | DateTime | Record creation time |
| updatedAt | DateTime | Record update time |
| deletedAt | DateTime | Soft delete timestamp |

---

## API Endpoint

### POST `/identify`

This endpoint receives contact information and returns the consolidated contact identity.

### Request Body

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
