function extractVideoId(url) {
  const regExp =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  const match = url.match(regExp);

  return match ? match[1] : null;
}

module.exports = extractVideoId;