# Favorites API — spec for backend

## Why

Favorites currently only exist locally — `localStorage` on the website, `shared_preferences`
on the Flutter app (confirmed in the app's own source: `core/favorites/favorites_service.dart`
is explicitly local-only, no backend call at all). That means favorites don't survive a
reinstall, a cleared browser, or switching devices. This spec adds a real backend-synced
favorites list, shared by both the website and the app — same two endpoints, same request/
response shapes, used identically by both.

Two endpoints, both under the existing `CustomerData` group, same auth pattern as
`GetBookingList`/`GetOwner`/`AddBooking`.

## Design note — why this is a simple snapshot, not a live join

The Flutter app already has an established pattern for favorites: `FavoriteItem`
(`core/favorites/favorite_item.dart`) is a small flat snapshot — `id`, `type`, `name`,
`image`, `price`, `location`, `rating` — built client-side from the chalet/building object
already in memory at the moment the user taps the heart icon, then persisted as-is.

Rather than asking backend to re-derive this by joining favorited ids back against the
chalets/buildings tables on every `GetFavorite` call, **the client sends this same flat
snapshot when favoriting, and the backend just stores and echoes it back.** Less backend
work (no joins, no per-type response shape to maintain), and both platforms already build
this exact object today for other reasons, so nothing new to compute on the client either.

The one accepted tradeoff: if a chalet's price or photo changes after it's been favorited,
the favorites list shows what it looked like *at the time it was favorited*, not live data.
This isn't a new limitation — it's exactly how the current local-only implementation on both
platforms already behaves, so this isn't a regression, just carrying the same behavior over.

---

## 1. `GET /api/CustomerData/GetFavorite`

**Full URL:** `https://www.shleeh.com/api/CustomerData/GetFavorites`

**Headers:**
- `Authorization: Bearer <token>` (same token as every other authenticated endpoint)
- `Content-Type: application/json`

**Request body:** none — GET request, user identified from the token alone.

**Response** — returns exactly what was stored via `ToggleFavorite` below, per item:

```json
{
  "status": true,
  "message": [
    {
      "type": "chalet",
      "id": 12,
      "name": "شاليه A4",
      "image": "https://www.shleeh.com/uploads/chalets/12/cover.jpg",
      "price": "50",
      "location": "مرباط ظفار",
      "rating": 4.6
    },
    {
      "type": "building",
      "id": 7,
      "name": "Sunset Apartments",
      "image": "https://www.shleeh.com/uploads/buildings/7/cover.jpg",
      "price": "25",
      "location": "صلالة ظفار",
      "rating": null
    }
  ]
}
```

Field notes:
- `type` — numeric enum, confirmed with backend: `1` = chalet, `2` = building. No separate
  "flat" value — favoriting is on the building/property level, matching how both platforms
  already treat it. (Both clients still use plain `'chalet'`/`'building'` strings internally
  and convert to/from this number only at the network boundary.)
- `id` — number, matching the id used everywhere else for this item.
- `name`, `image`, `location` — plain strings, whatever the client sent when favoriting
  (see `ToggleFavorite` below). `image` is sent as a full absolute URL by the client
  already, not a relative path — no `BASE_URL` prefixing needed on the way back out.
- `price` — sent as a string (matches the Dart app's `FavoriteItem.price` field type).
- `rating` — number or `null`, optional.

**No favorites yet:** `{ "status": true, "message": [] }` — empty array, a normal success
response, not an error.

**Invalid/missing token:** same behavior the existing authenticated endpoints already use
for this — follow that same convention here so existing client-side error handling on both
platforms covers it without new logic.

**Order:** most-recently-favorited first, if easy to add — not critical.

**No pagination** — favorites lists are small; return the full list every time.

---

## 2. `POST /api/CustomerData/ToggleFavorite`

**Full URL:** `https://www.shleeh.com/api/CustomerData/ToggleFavorite`

**Headers:** same as above (`Authorization: Bearer <token>`, `Content-Type: application/json`)

**Request body** — the full snapshot, not just the id:
```json
{
  "type": "chalet",
  "id": 12,
  "name": "شاليه A4",
  "image": "https://www.shleeh.com/uploads/chalets/12/cover.jpg",
  "price": "50",
  "location": "مرباط ظفار",
  "rating": 4.6
}
```
- Adds it (storing this exact object) if `{type, id}` isn't already favorited by this user;
  removes it if it is. A single toggle — one tap, one call, matching exactly how the
  heart-icon button already behaves on both platforms.
- Only `type` and `id` are needed to identify *which* favorite is being toggled (for
  removal); the rest of the fields only matter on the *add* path, since that's what gets
  stored and later echoed back by `GetFavorite`. Fine to just ignore the extra fields when
  the call turns out to be a removal.

**Response:**
```json
{ "status": true, "message": { "isFavorite": true } }
```
`isFavorite` reflects the *new* state after the toggle (`true` if just added, `false` if
just removed) — lets the client trust the server's result instead of just assuming its own
optimistic update was correct.

**Double-tap / race condition:** if the same `{type, id}` is toggled twice in quick
succession, the second call just toggles again from whatever the current stored state
actually is — plain toggle semantics, no special idempotency handling needed.
