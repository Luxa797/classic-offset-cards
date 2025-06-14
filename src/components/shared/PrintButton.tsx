import React from 'react';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  handlePrint: () => void;
  title?: string;
}

const PrintButton: React.FC<PrintButtonProps> = ({ handlePrint, title = 'Export PDF' }) => {
  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg shadow hover:shadow-lg transition-all duration-200"
    >
      <Printer size={18} />
      {title}
    </button>
  );
};

export default PrintButton;