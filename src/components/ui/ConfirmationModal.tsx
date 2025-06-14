import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin"/> : confirmText}
            </Button>
            <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="mt-3 w-full justify-center sm:mt-0 sm:col-start-1"
            >
              {cancelText}
            </Button>
        </div>
    </Modal>
  );
};

export default ConfirmationModal;