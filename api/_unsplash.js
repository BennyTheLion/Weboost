// Thin wrapper around the Unsplash Search API, used server-side only — the
// access key must never reach the browser. Fails soft everywhere: a missing
// key, network error, or empty result just returns null/[] so callers fall
// back to the placeholder UI instead of breaking page generation.
//
// Unsplash's API Guidelines require, for any photo actually displayed:
//   1. Visible attribution to the photographer and Unsplash.
//   2. A "download" tracking ping to the photo's links.download_location.
// https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines

const UNSPLASH_API = 'https://api.unsplash.com';

function toCredit(photo) {
  return {
    url: photo.urls?.regular || photo.urls?.small,
    alt: photo.alt_description || '',
    photographerName: photo.user?.name || 'Unsplash',
    photographerUrl: `${photo.user?.links?.html || 'https://unsplash.com'}?utm_source=weboost&utm_medium=referral`
  };
}

// Fires the required "download" ping. Best-effort — a tracking failure
// should never block or fail page generation.
function trackDownload(photo, key) {
  const url = photo?.links?.download_location;
  if (!url) return;
  fetch(url, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
}

// Searches for up to `count` photos matching an English-language query.
// Returns [] on any failure (missing key, no query, API error).
async function searchPhotos(query, count = 1) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query) return [];

  try {
    const res = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    results.forEach((photo) => trackDownload(photo, key));
    return results.map(toCredit);
  } catch (err) {
    return [];
  }
}

// Convenience for the common single-photo case. Returns null if unavailable.
async function fetchPhoto(query) {
  const [photo] = await searchPhotos(query, 1);
  return photo || null;
}

module.exports = { searchPhotos, fetchPhoto };
