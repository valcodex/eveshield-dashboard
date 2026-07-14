# EveShield API Documentation

Base URL (local): `http://localhost:4000/api`

All endpoints except `POST /auth/login` and `POST /auth/refresh` require an `Authorization: Bearer <accessToken>` header. The refresh token is stored in an httpOnly cookie set on login — the frontend's API client refreshes automatically on a 401.

Every response has the shape:
```json
{ "success": true, "data": { ... } }
```
or on error:
```json
{ "success": false, "message": "..." }
```

---

## Auth

### `POST /auth/login`
```json
{ "email": "admin@eveshield.org", "password": "ChangeMe123!" }
```
Returns `{ accessToken, user }` and sets the refresh-token cookie.

### `POST /auth/refresh`
No body. Reads the refresh cookie, returns a new `{ accessToken }`.

### `POST /auth/logout`
Revokes the refresh token and clears the cookie.

### `GET /auth/me`
Returns the current authenticated user.

---

## Victims

### `GET /victims?search=&page=&pageSize=`
Search by name, phone, or victim ID. Paginated.

### `GET /victims/:id`
Full victim record including emergency contacts, latest known location, and recent emergencies.

---

## Emergencies

### `GET /emergencies?status=&priority=&type=&region=&search=`
List/filter emergencies for the feed. Sorted by priority (desc) then most recent first.

### `GET /emergencies/:id`
Full emergency record: victim, timeline (`updates`), assigned responders, latest location.

### `POST /emergencies`
Creates a new emergency — this is the endpoint the mobile app's backend integration calls when a user presses the panic button.
```json
{
  "victim": {
    "id": "existing-victim-id-if-known",
    "fullName": "Jane Doe",
    "phoneNumber": "+254712345678",
    "gender": "Female",
    "age": 27,
    "bloodGroup": "O+",
    "medicalNotes": "Penicillin allergy",
    "emergencyContacts": [{ "name": "Mary Doe", "phone": "+254700000000", "relation": "Mother" }]
  },
  "type": "POLICE",
  "priority": "CRITICAL",
  "latitude": -1.286389,
  "longitude": 36.817223,
  "region": "Nairobi"
}
```
Broadcasts `emergency:new` to every connected dashboard client.

### `PATCH /emergencies/:id`
Any combination of:
```json
{
  "status": "IN_PROGRESS",
  "priority": "CRITICAL",
  "note": "Ambulance en route, ETA 4 minutes",
  "escalate": true,
  "requestBackup": true
}
```
Requires `ORG_ADMIN`, `ORG_OPERATOR`, `POLICE`, or `MEDICAL`. Every field supplied appends a timeline event and writes an audit log entry.

### `POST /assignResponder`
```json
{ "emergencyId": "...", "responderId": "...", "role": "primary" }
```
Requires `ORG_ADMIN` or `ORG_OPERATOR`. Broadcasts `emergency:responder_assigned`.

### `POST /updateLocation`
Called repeatedly by the mobile app while an emergency is active.
```json
{ "victimId": "...", "emergencyId": "...", "latitude": -1.2864, "longitude": 36.8172, "accuracy": 8.5 }
```
Broadcasts `location:updated`.

---

## Responders

### `GET /responders?type=&status=`
List responders (police/medical/fire) filterable by type and availability status.

---

## Notifications

### `GET /notifications`
Latest broadcast + user-targeted notifications.

### `POST /notifications`
Create and broadcast a manual/system notification.

---

## Dashboard

### `GET /dashboard/stats`
```json
{
  "activeEmergencies": 4,
  "resolvedEmergencies": 128,
  "highPriorityAlerts": 2,
  "victimsAwaitingResponse": 1
}
```

---

## Real-time events (Socket.IO)

Connect with `io(baseUrl, { auth: { token: accessToken } })`. All dashboard clients join a shared `ops-center` room.

| Event | Payload | Fired when |
|---|---|---|
| `emergency:new` | Full emergency | A new panic alert is created |
| `emergency:updated` | Full emergency | Any PATCH to an emergency |
| `emergency:status_updated` | Full emergency | Status field changes |
| `emergency:responder_assigned` | Full emergency | A responder is assigned |
| `location:updated` | `{ victimId, emergencyId, latitude, longitude, ... }` | New GPS ping received |
| `emergency:resolved` | Full emergency | Status set to `RESOLVED` |
| `notification:new` | Notification | Any of the above, formatted for the notification bell |
