const PERMISSIONS = {
  superadmin:  ['*'],
  admin:       ['hr:read','hr:write','inventory:read','inventory:write','accounting:read','crm:read','crm:write'],
  hr_manager:  ['hr:read','hr:write','hr:payroll'],
  accountant:  ['accounting:read','accounting:write','inventory:read'],
  sales:       ['crm:read','crm:write','inventory:read'],
  warehouse:   ['inventory:read','inventory:write'],
};

const permit = (...required) => (req, res, next) => {
  const userPerms = PERMISSIONS[req.user.role] || [];
  const hasAccess = userPerms.includes('*') || required.every(p => userPerms.includes(p));
  if (!hasAccess) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  next();
};

module.exports = { permit };