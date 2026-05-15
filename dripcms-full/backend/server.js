const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const low        = require('lowdb');
const FileSync   = require('lowdb/adapters/FileSync');
const { v4: uuid } = require('uuid');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3001;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const adapter = new FileSync(path.join(dataDir, 'db.json'));
const db      = low(adapter);
db.defaults({ customers: [], orders: [], users: [] }).write();

app.use(cors());
app.use(bodyParser.json());

// Serve frontend
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

const orderID   = () => 'DC' + Date.now().toString().slice(-5);
const timestamp = () => new Date().toISOString();

// AUTH
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required.' });
  if (db.get('users').find({ email }).value()) return res.status(409).json({ error: 'Email already registered.' });
  const user = { id: uuid(), name, email, password, phone: phone||'', createdAt: timestamp() };
  db.get('users').push(user).write();
  const { password: _, ...safe } = user;
  res.status(201).json({ message: 'Account created.', user: safe });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  const user = db.get('users').find({ email, password }).value();
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
  const { password: _, ...safe } = user;
  res.json({ message: 'Login successful.', user: safe });
});

// CUSTOMERS
app.get('/api/customers', (req, res) => res.json({ count: db.get('customers').value().length, customers: db.get('customers').value() }));
app.post('/api/customers', (req, res) => {
  const { name, phone, email, address } = req.body;
  if (!name||!phone||!email||!address) return res.status(400).json({ error: 'All fields required.' });
  const c = { id: uuid(), name, phone, email, address, createdAt: timestamp() };
  db.get('customers').push(c).write();
  res.status(201).json({ message: 'Customer saved.', customer: c });
});
app.get('/api/customers/:id', (req, res) => { const c=db.get('customers').find({id:req.params.id}).value(); c?res.json(c):res.status(404).json({error:'Not found.'}); });
app.put('/api/customers/:id', (req, res) => { if(!db.get('customers').find({id:req.params.id}).value()) return res.status(404).json({error:'Not found.'}); db.get('customers').find({id:req.params.id}).assign(req.body).write(); res.json({message:'Updated.',customer:db.get('customers').find({id:req.params.id}).value()}); });
app.delete('/api/customers/:id', (req, res) => { if(!db.get('customers').find({id:req.params.id}).value()) return res.status(404).json({error:'Not found.'}); db.get('customers').remove({id:req.params.id}).write(); res.json({message:'Deleted.'}); });

// ORDERS
app.get('/api/orders', (req, res) => { let o=db.get('orders').value(); if(req.query.status) o=o.filter(x=>x.status===req.query.status); res.json({count:o.length,orders:o}); });
app.post('/api/orders', (req, res) => {
  const { name, phone, address, product, size, qty, amount, status } = req.body;
  if (!name||!phone||!address||!product||!amount) return res.status(400).json({ error: 'name, phone, address, product, amount required.' });
  const o = { id: uuid(), orderId: orderID(), name, phone, address, product, size:size||'M', qty:qty||1, amount, status:status||'Pending', createdAt:timestamp(), updatedAt:timestamp() };
  db.get('orders').push(o).write();
  res.status(201).json({ message: 'Order saved.', order: o });
});
app.get('/api/orders/:id', (req, res) => { const o=db.get('orders').find({id:req.params.id}).value()||db.get('orders').find({orderId:req.params.id}).value(); o?res.json(o):res.status(404).json({error:'Not found.'}); });
app.put('/api/orders/:id', (req, res) => { if(!db.get('orders').find({id:req.params.id}).value()) return res.status(404).json({error:'Not found.'}); db.get('orders').find({id:req.params.id}).assign({...req.body,updatedAt:timestamp()}).write(); res.json({message:'Updated.',order:db.get('orders').find({id:req.params.id}).value()}); });
app.delete('/api/orders/:id', (req, res) => { if(!db.get('orders').find({id:req.params.id}).value()) return res.status(404).json({error:'Not found.'}); db.get('orders').remove({id:req.params.id}).write(); res.json({message:'Deleted.'}); });

// STATS & HEALTH
app.get('/api/stats', (req, res) => {
  const orders=db.get('orders').value(), customers=db.get('customers').value(), users=db.get('users').value();
  const rev=orders.reduce((s,o)=>s+Number(o.amount||0),0);
  const byStatus=orders.reduce((a,o)=>{a[o.status]=(a[o.status]||0)+1;return a;},{});
  res.json({totalCustomers:customers.length,totalOrders:orders.length,totalUsers:users.length,totalRevenue:rev,revenueDisplay:'₹'+rev.toLocaleString('en-IN'),ordersByStatus:byStatus});
});
app.get('/api/health', (req, res) => res.json({ status:'ok', uptime:process.uptime().toFixed(0)+'s', time:timestamp() }));

// Catch-all SPA
app.get('*', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   DRIP CULTURE is live                 ║
  ║   http://localhost:${PORT}                 ║
  ╠════════════════════════════════════════╣
  ║  Frontend → http://localhost:${PORT}/     ║
  ║  API      → http://localhost:${PORT}/api/ ║
  ║  DB       → backend/data/db.json       ║
  ╚════════════════════════════════════════╝
  `);
});
