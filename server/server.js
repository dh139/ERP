const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

dotenv.config();

const connectDB         = require('./config/db');
const errorHandler      = require('./middleware/errorHandler');
const authRoutes        = require('./modules/auth/auth.routes');
const inventoryRoutes   = require('./modules/inventory/inventory.routes');
const crmRoutes         = require('./modules/crm/crm.routes');
const hrRoutes = require('./modules/hr/hr.routes');
const accountingRoutes = require('./modules/accounting/accounting.routes');
const alertRoutes = require('./modules/alerts/alerts.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/crm',       crmRoutes);
app.use('/api/hr', hrRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.use('/api/accounting', accountingRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));