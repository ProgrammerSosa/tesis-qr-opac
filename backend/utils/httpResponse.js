function ok(res, data, message, status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, error, status = 400) {
  return res.status(status).json({ success: false, error });
}

function notFound(res, error = 'Recurso no encontrado') {
  return fail(res, error, 404);
}

module.exports = { ok, fail, notFound };
