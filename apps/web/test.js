const lucide = require('lucide-react');
const icons = ['CodeIcon', 'GlobeIcon', 'LayersIcon', 'UserPlusIcon', 'Users', 'Star', 'FileText', 'Shield', 'RotateCcw', 'Handshake', 'Leaf', 'HelpCircle', 'BarChart', 'PlugIcon'];

for (const icon of icons) {
  if (!lucide[icon]) {
    console.error(`MISSING: ${icon}`);
  }
}
console.log('Done checking icons.');
