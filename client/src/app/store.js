import { configureStore } from '@reduxjs/toolkit';
import authReducer      from '../features/auth/authSlice';
import inventoryReducer from '../features/inventory/inventorySlice';
import crmReducer       from '../features/crm/crmSlice';
import hrReducer        from '../features/hr/hrSlice';
import accountingReducer  from '../features/accounting/accountingSlice';
import dashboardReducer   from '../features/dashboard/dashboardSlice';
export const store = configureStore({
  reducer: {
    auth:      authReducer,
    inventory: inventoryReducer,
    crm:       crmReducer,
    hr:        hrReducer,
    accounting: accountingReducer,
    dashboard:  dashboardReducer,
  },
});