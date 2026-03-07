const COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  new:        'bg-blue-100 text-blue-700',
  contacted:  'bg-yellow-100 text-yellow-700',
  qualified:  'bg-green-100 text-green-700',
  lost:       'bg-red-100 text-red-700',
  converted:  'bg-purple-100 text-purple-700',
  draft:      'bg-gray-100 text-gray-600',
  ordered:    'bg-blue-100 text-blue-700',
  received:   'bg-green-100 text-green-700',
  active:     'bg-green-100 text-green-700',
  inactive:   'bg-red-100 text-red-700',
  paid:       'bg-green-100 text-green-700',
  unpaid:     'bg-red-100 text-red-700',
};
const Badge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
    {status?.replace('_', ' ')}
  </span>
);
export default Badge;