module.exports = function cityMiddleware(req, res, next) {
  let city = req.header('x-city') || req.query.city || req.body?.city || 'manaus';
  city = String(city || 'manaus').toLowerCase();
  if (city !== 'manaus' && city !== 'itajai') city = 'manaus';
  req.city = city;
  
  // Se MONGODB_URI está configurado, usa MongoDB; caso contrário, usa mockdb
  if (process.env.MONGODB_URI) {
    console.log(`[CITY] Usando MongoDB para cidade: ${city}`);
    req.mockdb = require('../mongodbAdapter').forCity(city);
  } else {
    console.log(`[CITY] Usando MockDB para cidade: ${city}`);
    const mockdbFactory = require('../mockdb');
    req.mockdb = mockdbFactory.forCity ? mockdbFactory.forCity(city) : mockdbFactory;
  }
  next();
};
